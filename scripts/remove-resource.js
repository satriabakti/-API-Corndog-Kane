#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

async function main() {
  console.log('🗑️  Remove Resource\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const nameArg = args.find(arg => arg.startsWith('--name='));
  
  if (!nameArg) {
    console.error('❌ Usage: npm run remove:resource -- --name=<resource-name>');
    console.error('   Example: npm run remove:resource -- --name=material');
    process.exit(1);
  }

  const resourceName = nameArg.split('=')[1];
  
  if (!resourceName) {
    console.error('❌ Resource name is required!');
    console.error('   Example: npm run remove:resource -- --name=material');
    process.exit(1);
  }

  const resourceLower = resourceName.toLowerCase();
  const resourcePascal = toPascalCase(resourceName);
  const resourceCamel = toCamelCase(resourceName);

  console.log(`📝 Removing resource: ${resourcePascal}\n`);

  const filesToRemove = [
    `src/core/entities/${resourceLower}`,
    `src/core/repositories/${resourceLower}.ts`,
    `src/adapters/postgres/repositories/${resourcePascal}Repository.ts`,
    `src/core/services/${resourcePascal}Service.ts`,
    `src/mappers/mappers/${resourcePascal}MapperEntity.ts`,
    `src/mappers/response-mappers/${resourcePascal}ResponseMapper.ts`,
    `src/transports/api/validations/${resourceLower}.validation.ts`,
    `src/transports/api/controllers/${resourcePascal}Controller.ts`,
    `src/transports/api/routers/v1/${resourceLower}.ts`,
  ];

  let removedCount = 0;
  for (const file of filesToRemove) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      console.log(`✅ Removed: ${file}`);
      removedCount++;
    }
  }

  // Remove from controllers/index.ts
  removeFromIndexFile(
    'src/transports/api/controllers/index.ts',
    `export * from './${resourcePascal}Controller';`
  );

  // Remove from response-mappers/index.ts
  removeFromIndexFile(
    'src/mappers/response-mappers/index.ts',
    `export * from './${resourcePascal}ResponseMapper';`
  );

  // Remove from EntityMappers.ts
  removeFromEntityMappers(resourcePascal, resourceLower);

  // Remove from base Repository.ts TEntity type
  removeFromBaseRepositoryType(resourcePascal, resourceLower);

  // Remove from Service.ts TEntity type
  removeFromServiceType(resourcePascal, resourceLower);

  console.log(`\n✅ Resource removed successfully! (${removedCount} files deleted)`);
  console.log('\n📝 Next steps:');
  console.log(`1. Check src/transports/api/routers/v1/index.ts and remove the router import if exists`);
  console.log(`2. Run: npm run build`);
  console.log(`3. Remove the Prisma model from schema if needed\n`);
}

function removeFromIndexFile(filePath, lineToRemove) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Handle multiple export patterns
  const patterns = [
    lineToRemove,
    lineToRemove.replace(/;$/, ''),  // without semicolon
    lineToRemove + '\n',
    lineToRemove.replace(/;$/, '') + '\n',
  ];
  
  for (const pattern of patterns) {
    content = content.replace(pattern, '');
  }
  
  // Clean up any duplicate newlines
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

function removeFromEntityMappers(resourcePascal, resourceLower) {
  const mappersPath = 'src/mappers/EntityMappers.ts';
  if (!fs.existsSync(mappersPath)) return;

  let content = fs.readFileSync(mappersPath, 'utf8');
  const originalContent = content;
  
  // Remove import - handle various formats
  const importPatterns = [
    new RegExp(`import \\{ ${resourcePascal}MapperEntity \\} from ['"]./mappers/${resourcePascal}MapperEntity['"];?\n`, 'g'),
  ];
  
  for (const pattern of importPatterns) {
    content = content.replace(pattern, '');
  }
  
  // Remove from EntityMappers object - handle various formats including the line with or without comma/newline
  const objectPatterns = [
    new RegExp(`\\n\\s*${resourceLower}:\\s*${resourcePascal}MapperEntity,`, 'g'),
    new RegExp(`\\s*${resourceLower}:\\s*${resourcePascal}MapperEntity,\\n`, 'g'),
  ];
  
  for (const pattern of objectPatterns) {
    content = content.replace(pattern, '');
  }
  
  // Clean up formatting issues
  content = content.replace(/{\n\n\s+/g, '{\n  ');  // Fix extra newlines after opening brace
  content = content.replace(/,(\s*)\}/g, '$1}');     // Remove trailing comma before }
  content = content.replace(/\n\n\n+/g, '\n\n');     // Clean up multiple newlines
  content = content.replace(/:\s+/g, ': ');          // Normalize spacing after colons
  
  if (content !== originalContent) {
    fs.writeFileSync(mappersPath, content);
    console.log(`✅ Updated: ${mappersPath}`);
  }
}

function removeFromBaseRepositoryType(resourcePascal, resourceLower) {
  const repositoryPath = 'src/adapters/postgres/repositories/Repository.ts';
  if (!fs.existsSync(repositoryPath)) return;

  let content = fs.readFileSync(repositoryPath, 'utf8');
  
  // Remove import
  const importPattern = new RegExp(`import \\{ T${resourcePascal}, T${resourcePascal}WithID \\} from ["']../../../core/entities/${resourceLower}/${resourceLower}["'];?\n?`, 'g');
  content = content.replace(importPattern, '');
  
  // Remove from TEntity type - more precise regex
  const entityRegex = /export type TEntity = ([^;]+);/;
  const match = content.match(entityRegex);
  if (match) {
    let types = match[1];
    // Remove the specific types
    types = types.replace(new RegExp(`\\s*\\|\\s*T${resourcePascal}WithID`, 'g'), '');
    types = types.replace(new RegExp(`\\s*\\|\\s*T${resourcePascal}`, 'g'), '');
    types = types.replace(new RegExp(`T${resourcePascal}WithID\\s*\\|\\s*`, 'g'), '');
    types = types.replace(new RegExp(`T${resourcePascal}\\s*\\|\\s*`, 'g'), '');
    // Clean up any double spaces or pipes
    types = types.replace(/\|\s*\|/g, '|').replace(/\s+/g, ' ').trim();
    content = content.replace(entityRegex, `export type TEntity = ${types};`);
  }
  
  fs.writeFileSync(repositoryPath, content);
  console.log(`✅ Updated: ${repositoryPath}`);
}

function removeFromServiceType(resourcePascal, resourceLower) {
  const servicePath = 'src/core/services/Service.ts';
  if (!fs.existsSync(servicePath)) return;

  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Remove import
  const importPattern = new RegExp(`import \\{ T${resourcePascal}, T${resourcePascal}WithID \\} from ["']../entities/${resourceLower}/${resourceLower}["'];?\n?`, 'g');
  content = content.replace(importPattern, '');
  
  // Remove from TEntity type - multiline format with | at start
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    return !line.includes(`T${resourcePascal}WithID`) && !line.includes(`| T${resourcePascal}`);
  });
  
  content = filteredLines.join('\n');
  
  // Clean up any issues
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(servicePath, content);
  console.log(`✅ Updated: ${servicePath}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
