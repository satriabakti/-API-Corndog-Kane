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

function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

async function main() {
  console.log('🚀 Create New Resource\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const nameArg = args.find(arg => arg.startsWith('--name='));
  
  if (!nameArg) {
    console.error('❌ Usage: npm run generate:resource --name=<resource-name>');
    console.error('   Example: npm run generate:resource --name=material');
    process.exit(1);
  }

  const resourceName = nameArg.split('=')[1];
  
  if (!resourceName) {
    console.error('❌ Resource name is required!');
    console.error('   Example: npm run generate:resource --name=material');
    process.exit(1);
  }

  const resourceLower = resourceName.toLowerCase();
  const resourcePascal = toPascalCase(resourceName);
  const resourceCamel = toCamelCase(resourceName);
  const resourceSnake = toSnakeCase(resourceName);

  // Default fields - can be customized later
  const fieldList = [
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'isActive', type: 'boolean' },
    { name: 'createdAt', type: 'Date' },
    { name: 'updatedAt', type: 'Date' }
  ];

  console.log(`📝 Creating resource: ${resourcePascal}`);
  console.log(`Fields: ${fieldList.map(f => `${f.name}: ${f.type}`).join(', ')}\n`);

  // 1. Create Entity Type
  createEntityType(resourceLower, resourcePascal, fieldList);

  // 2. Create Repository Interface
  createRepositoryInterface(resourceLower, resourcePascal);

  // 3. Create Repository Adapter
  // 3. Create Repository Adapter
  createRepositoryAdapter(resourceLower, resourcePascal, resourceCamel, resourceSnake);

  // 4. Create Service
  createService(resourcePascal);

  // 5. Create Entity Mapper
  createEntityMapper(resourcePascal, resourceCamel, fieldList);

  // 6. Create Response Mapper
  createResponseMapper(resourcePascal, resourceLower, resourceCamel);

  // 7. Create Validation Schema
  createValidationSchema(resourceLower, fieldList);

  // 8. Create Controller
  createController(resourcePascal, resourceLower);

  // 9. Create Router
  createRouter(resourceLower, resourcePascal, resourceCamel);

  // 10. Update base Repository TEntity type
  updateBaseRepositoryType(resourcePascal, resourceLower);

  // 11. Update Service TEntity type
  updateServiceType(resourcePascal, resourceLower);

  // 12. Update index files
  updateIndexFiles(resourcePascal, resourceLower, resourceCamel);

  console.log('\n✅ Resource created successfully!');
  console.log('\n📝 Next steps:');
  console.log(`1. Update src/transports/api/routers/v1/index.ts to import the new router`);
  console.log(`2. Run: npm run build`);
  console.log(`3. Test your endpoints!\n`);
}

function createEntityType(resourceLower, resourcePascal, fields) {
  const dir = `src/core/entities/${resourceLower}`;
  fs.mkdirSync(dir, { recursive: true });

  const typeFields = fields.map(f => {
    const optional = ['isActive', 'createdAt', 'updatedAt'].includes(f.name) ? '?' : '';
    return `  ${f.name}${optional}: ${f.type};`;
  }).join('\n');

  const content = `
export type T${resourcePascal} = {
${typeFields}
}

export type T${resourcePascal}WithID = T${resourcePascal} & { id: number };
export type T${resourcePascal}Create = Omit<T${resourcePascal}, 'createdAt' | 'updatedAt'>;
export type T${resourcePascal}Update = Partial<T${resourcePascal}Create>;

export type T${resourcePascal}GetResponse = Omit<T${resourcePascal}WithID, 'isActive' | 'createdAt' | 'updatedAt'> & {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type T${resourcePascal}CreateRequest = Omit<T${resourcePascal}Create, 'isActive'> & {
  is_active?: boolean;
};

export type T${resourcePascal}UpdateRequest = Partial<T${resourcePascal}CreateRequest>;
`;

  fs.writeFileSync(`${dir}/${resourceLower}.ts`, content.trim());
  console.log(`✅ Created: ${dir}/${resourceLower}.ts`);
}

function createRepositoryInterface(resourceLower, resourcePascal) {
  const dir = 'src/core/repositories';
  const content = `import { T${resourcePascal} } from "../entities/${resourceLower}/${resourceLower}";
import Repository from "./Repository";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ${resourcePascal}Repository extends Repository<T${resourcePascal}> {}
`;

  fs.writeFileSync(`${dir}/${resourceLower}.ts`, content);
  console.log(`✅ Created: ${dir}/${resourceLower}.ts`);
}

function createRepositoryAdapter(resourceLower, resourcePascal, resourceCamel, resourceSnake) {
  const dir = 'src/adapters/postgres/repositories';
  const content = `import { T${resourcePascal}, T${resourcePascal}WithID } from "../../../core/entities/${resourceLower}/${resourceLower}";
import { ${resourcePascal}Repository as I${resourcePascal}Repository } from "../../../core/repositories/${resourceLower}";
import Repository from "./Repository";

export default class ${resourcePascal}Repository
	extends Repository<T${resourcePascal} | T${resourcePascal}WithID>
	implements I${resourcePascal}Repository
{
	constructor() {
		super("${resourceLower}");
	}
}
`;

  fs.writeFileSync(`${dir}/${resourcePascal}Repository.ts`, content);
  console.log(`✅ Created: ${dir}/${resourcePascal}Repository.ts`);
}

function createService(resourcePascal) {
  const dir = 'src/core/services';
  const resourceLower = resourcePascal.toLowerCase();
  const content = `import ${resourcePascal}Repository from "../../adapters/postgres/repositories/${resourcePascal}Repository";
import { T${resourcePascal}, T${resourcePascal}WithID } from "../entities/${resourceLower}/${resourceLower}";
import { Service } from "./Service";

export default class ${resourcePascal}Service extends Service<T${resourcePascal} | T${resourcePascal}WithID> {
	declare repository: ${resourcePascal}Repository;

	constructor(repository: ${resourcePascal}Repository) {
		super(repository);
	}
}
`;

  fs.writeFileSync(`${dir}/${resourcePascal}Service.ts`, content);
  console.log(`✅ Created: ${dir}/${resourcePascal}Service.ts`);
}

function createEntityMapper(resourcePascal, resourceCamel, fields) {
  const dir = 'src/mappers/mappers';
  fs.mkdirSync(dir, { recursive: true });

  const fieldMappings = fields.map(f => {
    const dbField = toSnakeCase(f.name);
    const entityField = f.name;
    
    if (f.name === 'id') {
      return `    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },`;
    } else if (dbField !== entityField) {
      return `    { dbField: '${dbField}', entityField: '${entityField}' },`;
    } else {
      return `    { dbField: '${dbField}', entityField: '${entityField}' },`;
    }
  }).join('\n');

  const content = `import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const ${resourcePascal}MapperEntity: EntityMapConfig = {
  fields: [
${fieldMappings}
  ],
  relations: [],
};
`;

  fs.writeFileSync(`${dir}/${resourcePascal}MapperEntity.ts`, content);
  console.log(`✅ Created: ${dir}/${resourcePascal}MapperEntity.ts`);
}

function createResponseMapper(resourcePascal, resourceLower, resourceCamel) {
  const dir = 'src/mappers/response-mappers';
  fs.mkdirSync(dir, { recursive: true });

  const content = `import { T${resourcePascal}GetResponse, T${resourcePascal}WithID } from "../../core/entities/${resourceLower}/${resourceLower}";

export class ${resourcePascal}ResponseMapper {
  /**
   * Map ${resourcePascal} entity to list response format (simplified)
   * Used in findAll endpoints
   */
  static toListResponse(${resourceCamel}: T${resourcePascal}WithID): T${resourcePascal}GetResponse {
    return {
      id: ${resourceCamel}.id,
      ...Object.keys(${resourceCamel})
        .filter(key => !['id', 'isActive', 'createdAt', 'updatedAt'].includes(key))
        .reduce((obj, key) => {
          obj[key] = ${resourceCamel}[key];
          return obj;
        }, {} as any),
      is_active: ${resourceCamel}.isActive ?? true,
      created_at: ${resourceCamel}.createdAt ?? new Date(),
      updated_at: ${resourceCamel}.updatedAt ?? new Date(),
    } as T${resourcePascal}GetResponse;
  }
}
`;

  fs.writeFileSync(`${dir}/${resourcePascal}ResponseMapper.ts`, content);
  console.log(`✅ Created: ${dir}/${resourcePascal}ResponseMapper.ts`);
}

function createValidationSchema(resourceLower, fields) {
  const dir = 'src/transports/api/validations';
  
  const createFields = fields
    .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.name))
    .map(f => {
      const fieldName = toSnakeCase(f.name);
      const isRequired = !['isActive'].includes(f.name);
      
      let validation = '';
      if (f.type === 'string') {
        validation = `z.string().min(1, '${f.name} is required')`;
      } else if (f.type === 'number') {
        validation = `z.number().positive('${f.name} must be positive')`;
      } else if (f.type === 'boolean') {
        validation = `z.boolean()`;
      } else {
        validation = `z.string()`;
      }
      
      if (!isRequired) {
        validation += '.optional()';
      }
      
      return `    ${fieldName}: ${validation},`;
    }).join('\n');

  const updateFields = fields
    .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.name))
    .map(f => {
      const fieldName = toSnakeCase(f.name);
      
      let validation = '';
      if (f.type === 'string') {
        validation = `z.string().min(1, '${f.name} is required')`;
      } else if (f.type === 'number') {
        validation = `z.number().positive('${f.name} must be positive')`;
      } else if (f.type === 'boolean') {
        validation = `z.boolean()`;
      } else {
        validation = `z.string()`;
      }
      
      validation += '.optional()';
      
      return `    ${fieldName}: ${validation},`;
    }).join('\n');

  const content = `import z from 'zod';

export const create${toPascalCase(resourceLower)}Schema = z.object({
  body: z.object({
${createFields}
  }),
});

export const update${toPascalCase(resourceLower)}Schema = z.object({
  body: z.object({
${updateFields}
  }),
  params: z.object({
    id: z.string().regex(/^\\d+$/, 'Invalid ${resourceLower} ID'),
  }),
});

export const delete${toPascalCase(resourceLower)}Schema = z.object({
  params: z.object({
    id: z.string().regex(/^\\d+$/, 'Invalid ${resourceLower} ID'),
  }),
});
`;

  fs.writeFileSync(`${dir}/${resourceLower}.validation.ts`, content);
  console.log(`✅ Created: ${dir}/${resourceLower}.validation.ts`);
}

function createController(resourcePascal, resourceLower) {
  const dir = 'src/transports/api/controllers';
  const content = `import { TMetadataResponse } from "../../../core/entities/base/response";
import { T${resourcePascal}GetResponse } from "../../../core/entities/${resourceLower}/${resourceLower}";
import ${resourcePascal}Service from '../../../core/services/${resourcePascal}Service';
import ${resourcePascal}Repository from "../../../adapters/postgres/repositories/${resourcePascal}Repository";
import Controller from "./Controller";

export class ${resourcePascal}Controller extends Controller<T${resourcePascal}GetResponse, TMetadataResponse> {
  private ${toCamelCase(resourcePascal)}Service: ${resourcePascal}Service;

  constructor() {
    super();
    this.${toCamelCase(resourcePascal)}Service = new ${resourcePascal}Service(new ${resourcePascal}Repository());
  }
}
`;

  fs.writeFileSync(`${dir}/${resourcePascal}Controller.ts`, content);
  console.log(`✅ Created: ${dir}/${resourcePascal}Controller.ts`);
}

function createRouter(resourceLower, resourcePascal, resourceCamel) {
  const dir = 'src/transports/api/routers/v1';
  const content = `
import express from 'express';
import { ${resourcePascal}Controller } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import { create${resourcePascal}Schema, update${resourcePascal}Schema, delete${resourcePascal}Schema } from '../../validations/${resourceLower}.validation';
import ${resourcePascal}Service from '../../../../core/services/${resourcePascal}Service';
import ${resourcePascal}Repository from '../../../../adapters/postgres/repositories/${resourcePascal}Repository';
import { ${resourcePascal}ResponseMapper } from "../../../../mappers/response-mappers";
import { getPaginationSchema } from '../../validations/pagination.validation';

const router = express.Router();

const ${resourceCamel}Controller = new ${resourcePascal}Controller();
const ${resourceCamel}Service = new ${resourcePascal}Service(new ${resourcePascal}Repository());

router.get(
	"/",
	validate(getPaginationSchema),
	${resourceCamel}Controller.findAll(${resourceCamel}Service, ${resourcePascal}ResponseMapper)
);
router.post(
	"/",
	validate(create${resourcePascal}Schema),
	${resourceCamel}Controller.create(
		${resourceCamel}Service,
		${resourcePascal}ResponseMapper,
		"${resourcePascal} created successfully"
	)
);
router.put(
	"/:id",
	validate(update${resourcePascal}Schema),
	${resourceCamel}Controller.update(
		${resourceCamel}Service,
		${resourcePascal}ResponseMapper,
		"${resourcePascal} updated successfully"
	)
);
router.delete(
	"/:id",
	validate(delete${resourcePascal}Schema),
	${resourceCamel}Controller.delete(${resourceCamel}Service, "${resourcePascal} deleted successfully")
);

export default router;
`;

  fs.writeFileSync(`${dir}/${resourceLower}.ts`, content.trim());
  console.log(`✅ Created: ${dir}/${resourceLower}.ts`);
}

function updateBaseRepositoryType(resourcePascal, resourceLower) {
  const repositoryPath = 'src/adapters/postgres/repositories/Repository.ts';
  let content = fs.readFileSync(repositoryPath, 'utf8');
  
  // Add import if not exists
  const importStatement = `import { T${resourcePascal}, T${resourcePascal}WithID } from "../../../core/entities/${resourceLower}/${resourceLower}";`;
  if (!content.includes(importStatement)) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    }
  }
  
  // Update TEntity type
  const entityRegex = /export type TEntity = ([^;]+);/;
  const match = content.match(entityRegex);
  if (match) {
    const currentTypes = match[1];
    if (!currentTypes.includes(`T${resourcePascal}`)) {
      const newTypes = `${currentTypes} | T${resourcePascal} | T${resourcePascal}WithID`;
      content = content.replace(entityRegex, `export type TEntity = ${newTypes};`);
      fs.writeFileSync(repositoryPath, content);
      console.log(`✅ Updated: ${repositoryPath}`);
    }
  }
}

function updateServiceType(resourcePascal, resourceLower) {
  const servicePath = 'src/core/services/Service.ts';
  if (!fs.existsSync(servicePath)) return;

  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Add import if not exists
  const importStatement = `import { T${resourcePascal}, T${resourcePascal}WithID } from "../entities/${resourceLower}/${resourceLower}";`;
  if (!content.includes(importStatement)) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    }
  }
  
  // Update TEntity type - it uses multiline format with | at start of line
  const entityRegex = /export type TEntity =\s*\n([\s\S]*?)\n\s*;/;
  const match = content.match(entityRegex);
  if (match) {
    const currentTypes = match[1];
    if (!currentTypes.includes(`T${resourcePascal}`)) {
      // Add new types before the semicolon, maintaining the multiline format
      const newTypes = currentTypes.trimEnd() + `\n\t| T${resourcePascal}\n\t| T${resourcePascal}WithID`;
      content = content.replace(entityRegex, `export type TEntity =\n${newTypes}\n\t;`);
      fs.writeFileSync(servicePath, content);
      console.log(`✅ Updated: ${servicePath}`);
    }
  }
}

function updateIndexFiles(resourcePascal, resourceLower, resourceCamel) {
  // Update controllers/index.ts
  const controllersIndex = 'src/transports/api/controllers/index.ts';
  let content = fs.readFileSync(controllersIndex, 'utf8');
  if (!content.includes(`./${resourcePascal}Controller`)) {
    // Ensure file ends with newline before adding
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
    content += `export * from './${resourcePascal}Controller';\n`;
    fs.writeFileSync(controllersIndex, content);
    console.log(`✅ Updated: ${controllersIndex}`);
  }

  // Update response-mappers/index.ts
  const mappersIndex = 'src/mappers/response-mappers/index.ts';
  if (fs.existsSync(mappersIndex)) {
    let content = fs.readFileSync(mappersIndex, 'utf8');
    if (!content.includes(`./${resourcePascal}ResponseMapper`)) {
      // Ensure file ends with newline before adding
      if (content.length > 0 && !content.endsWith('\n')) {
        content += '\n';
      }
      content += `export * from './${resourcePascal}ResponseMapper';\n`;
      fs.writeFileSync(mappersIndex, content);
      console.log(`✅ Updated: ${mappersIndex}`);
    }
  }

  // Update EntityMappers.ts
  const entityMappers = 'src/mappers/EntityMappers.ts';
  let mapperContent = fs.readFileSync(entityMappers, 'utf8');
  
  // Add import
  const importLine = `import { ${resourcePascal}MapperEntity } from "./mappers/${resourcePascal}MapperEntity";`;
  if (!mapperContent.includes(importLine)) {
    const lastImportIndex = mapperContent.lastIndexOf('import');
    const endOfLastImport = mapperContent.indexOf('\n', lastImportIndex);
    mapperContent = mapperContent.slice(0, endOfLastImport + 1) + importLine + '\n' + mapperContent.slice(endOfLastImport + 1);
  }
  
  // Add to EntityMappers object - use resourceLower not resourceCamel
  const mapperEntry = `  ${resourceLower}: ${resourcePascal}MapperEntity,`;
  if (!mapperContent.includes(mapperEntry)) {
    mapperContent = mapperContent.replace(
      /export const EntityMappers: Record<string, EntityMapConfig> = {/,
      `export const EntityMappers: Record<string, EntityMapConfig> = {\n${mapperEntry}`
    );
  }
  
  fs.writeFileSync(entityMappers, mapperContent);
  console.log(`✅ Updated: ${entityMappers}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
