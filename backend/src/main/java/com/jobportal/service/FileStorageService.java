package com.jobportal.service;

import com.jobportal.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Stores resumes on the local filesystem under {@code app.upload-dir}. Paths in the DB are relative to it. */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final Map<String, String> ALLOWED = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root.resolve("resumes"));
        Files.createDirectories(root.resolve("applications"));
    }

    public record StoredFile(String path, String originalName, String contentType) {
    }

    public StoredFile storeResume(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Please choose a file to upload");
        }
        String original = sanitizeName(file.getOriginalFilename());
        String ext = extension(original);
        if (!ALLOWED.containsKey(ext)) {
            throw ApiException.badRequest("Only PDF, DOC or DOCX files are allowed");
        }
        String relative = "resumes/" + UUID.randomUUID() + "." + ext;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, resolve(relative), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file");
        }
        return new StoredFile(relative, original, ALLOWED.get(ext));
    }

    /** Stores raw bytes (used for demo seed data). */
    public StoredFile storeResumeBytes(byte[] data, String originalName) {
        String ext = extension(originalName);
        String relative = "resumes/" + UUID.randomUUID() + "." + ext;
        try {
            Files.write(resolve(relative), data);
        } catch (IOException e) {
            throw new IllegalStateException("Could not store file", e);
        }
        return new StoredFile(relative, originalName, ALLOWED.getOrDefault(ext, "application/octet-stream"));
    }

    /** Copies a stored resume so an application keeps the version that was submitted. */
    public String copyForApplication(String relativePath) {
        String ext = extension(relativePath);
        String target = "applications/" + UUID.randomUUID() + "." + ext;
        try {
            Files.copy(resolve(relativePath), resolve(target));
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not attach resume");
        }
        return target;
    }

    public Resource load(String relativePath) {
        Path path = resolve(relativePath);
        if (!Files.isReadable(path)) {
            throw ApiException.notFound("File not found");
        }
        return new PathResource(path);
    }

    public void deleteQuietly(String relativePath) {
        if (relativePath == null) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException | ApiException e) {
            log.warn("Could not delete file {}", relativePath, e);
        }
    }

    public void deleteAllQuietly(Collection<String> relativePaths) {
        relativePaths.forEach(this::deleteQuietly);
    }

    private Path resolve(String relativePath) {
        Path path = root.resolve(relativePath).normalize();
        if (!path.startsWith(root)) {
            throw ApiException.badRequest("Invalid file path");
        }
        return path;
    }

    private static String sanitizeName(String name) {
        if (name == null || name.isBlank()) {
            return "resume";
        }
        String normalized = name.replace('\\', '/');
        String base = normalized.substring(normalized.lastIndexOf('/') + 1);
        return base.replaceAll("[^A-Za-z0-9._ -]", "_");
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
