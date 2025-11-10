/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

export const storage = (folderName: string) => {
	const uploadPath = path.join(__dirname, "../../public/", folderName);

	// Ensure folder exists
	if (!fs.existsSync(uploadPath)) {
		fs.mkdirSync(uploadPath, { recursive: true });
	}

	const upload = multer({
		storage: multer.diskStorage({
			destination: (_req, _file, cb) => cb(null, uploadPath),
			filename: (_req, file, cb) => {
				const uniqueSuffix =
					Date.now() + "-" + Math.round(Math.random() * 1e9);
				const ext = path.extname(file.originalname);
				cb(null, `${folderName}-${uniqueSuffix}${ext}`);
			},
		}),
		limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
		fileFilter: (_req, file, cb) => {
			const allowedMimeTypes = [
				"image/jpeg",
				"image/png",
				"image/webp",
				"image/gif",
			];
			if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
			else
				cb(
					new Error(
						"Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."
					)
				);
		},
	});

	const middleware = (fieldName: string) => {
		const singleUpload = upload.single(fieldName);

		return async (req: Request, res: Response, next: NextFunction) => {
			singleUpload(req, res, async (err: any) => {
				if (err)
					return res.status(400).json({ message: err.message });

				if (!req.file) return next();

				const {
					path: filePath,
					destination,
					filename,
					mimetype,
				} = req.file;

				try {
					// Build compressed file path
					const compressedPath = path.join(
						destination,
						`compressed-${filename}.webp`
					);

					// Asynchronously compress the image
					const image = sharp(filePath).resize({
						width: 1080,
						withoutEnlargement: true,
					});

					if (
						[
							"image/jpeg",
							"image/png",
							"image/webp",
						].includes(mimetype)
					) {
						await image
							.webp({ quality: 80 })
							.toFile(compressedPath);
					} else {
						await image.toFile(compressedPath);
					}

					// Asynchronously remove the original file
					await fs.promises.unlink(filePath);

					// Replace req.file data to reflect the compressed version
					req.file.filename = path.basename(compressedPath);
					req.file.path = compressedPath;
					req.file.size = (
						await fs.promises.stat(compressedPath)
					).size;
				} catch (compressionErr) {
					console.error(
						"❌ Image compression failed:",
						compressionErr
					);
				}

				next();
			});
		};
	};

	return middleware;
};

/**
 * Storage middleware for multiple file uploads with compression
 * @param folderName - The folder name to store files
 * @returns Multer middleware for multiple file fields
 */
export const storageMultiple = (folderName: string) => {
	const uploadPath = path.join(__dirname, "../../public/", folderName);

	// Ensure folder exists
	if (!fs.existsSync(uploadPath)) {
		fs.mkdirSync(uploadPath, { recursive: true });
	}

	const upload = multer({
		storage: multer.diskStorage({
			destination: (_req, _file, cb) => cb(null, uploadPath),
			filename: (_req, file, cb) => {
				const uniqueSuffix =
					Date.now() + "-" + Math.round(Math.random() * 1e9);
				const ext = path.extname(file.originalname);
				cb(null, `${folderName}-${uniqueSuffix}${ext}`);
			},
		}),
		limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
		fileFilter: (_req, file, cb) => {
			const allowedMimeTypes = [
				"image/jpeg",
				"image/png",
				"image/webp",
				"image/gif",
			];
			if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
			else
				cb(
					new Error(
						"Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."
					)
				);
		},
	});

	const middleware = (fields: { name: string; maxCount: number }[]) => {
		const multipleUpload = upload.fields(fields);

		return async (req: Request, res: Response, next: NextFunction) => {
			multipleUpload(req, res, async (err: any) => {
				if (err)
					return res.status(400).json({ message: err.message });

				if (!req.files) return next();

				const filesObject = req.files as { [fieldname: string]: Express.Multer.File[] };

				try {
					// Compress all uploaded files
					for (const fieldName of Object.keys(filesObject)) {
						const files = filesObject[fieldName];
						
						for (const file of files) {
							const {
								path: filePath,
								destination,
								filename,
								mimetype,
							} = file;

							// Build compressed file path
							const compressedPath = path.join(
								destination,
								`compressed-${filename}.webp`
							);

							// Asynchronously compress the image
							const image = sharp(filePath).resize({
								width: 1080,
								withoutEnlargement: true,
							});

							if (
								[
									"image/jpeg",
									"image/png",
									"image/webp",
								].includes(mimetype)
							) {
								await image
									.webp({ quality: 80 })
									.toFile(compressedPath);
							} else {
								await image.toFile(compressedPath);
							}

							// Asynchronously remove the original file
							await fs.promises.unlink(filePath);

							// Replace file data to reflect the compressed version
							file.filename = path.basename(compressedPath);
							file.path = compressedPath;
							file.size = (
								await fs.promises.stat(compressedPath)
							).size;
						}
					}
				} catch (compressionErr) {
					console.error(
						"❌ Image compression failed:",
						compressionErr
					);
				}

				next();
			});
		};
	};

	return middleware;
};
