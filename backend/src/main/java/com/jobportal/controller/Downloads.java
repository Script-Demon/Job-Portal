package com.jobportal.controller;

import com.jobportal.service.SeekerService.DownloadableFile;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;

import java.nio.charset.StandardCharsets;

final class Downloads {

    private Downloads() {
    }

    static ResponseEntity<Resource> attachment(DownloadableFile file) {
        String name = file.fileName() != null ? file.fileName() : "resume";
        MediaType type = file.contentType() != null
                ? MediaType.parseMediaType(file.contentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        // Only use the RFC 5987 encoded form when needed; plain ASCII names stay readable.
        boolean ascii = StandardCharsets.US_ASCII.newEncoder().canEncode(name);
        ContentDisposition disposition = ascii
                ? ContentDisposition.attachment().filename(name).build()
                : ContentDisposition.attachment().filename(name, StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(file.resource());
    }
}
