//package com.academicadvisor.backend.controller;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.*;
//import org.springframework.http.client.SimpleClientHttpRequestFactory;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.*;
//
//@RestController
//@RequestMapping("/api/ai")
//public class AiController {
//
//    @Value("${groq.api.key}")
//    private String apiKey;
//
//    @Value("${groq.model}")
//    private String model;
//
//    private final RestTemplate restTemplate;
//
//    public AiController() {
//        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
//        factory.setConnectTimeout(10000);
//        factory.setReadTimeout(30000);
//        this.restTemplate = new RestTemplate(factory);
//    }
//
//    @PostMapping("/chat")
//    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
//        String message = request.getOrDefault("message", "");
//        String system  = request.getOrDefault("system", "You are a helpful academic advisor.");
//
//        String url = "https://api.groq.com/openai/v1/chat/completions";
//
//        Map<String, Object> body = Map.of(
//                "model", model,
//                "messages", List.of(
//                        Map.of("role", "system", "content", system),
//                        Map.of("role", "user", "content", message)
//                ),
//                "temperature", 0.7,
//                "max_tokens", 1024
//        );
//
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.setBearerAuth(apiKey);
//
//        try {
//            ResponseEntity<Map> response = restTemplate.exchange(
//                    url, HttpMethod.POST,
//                    new HttpEntity<>(body, headers),
//                    Map.class
//            );
//
//            List<Map> choices = (List<Map>) response.getBody().get("choices");
//            Map message0 = (Map) choices.get(0).get("message");
//            String aiText = (String) message0.get("content");
//
//            return ResponseEntity.ok(Map.of("response", aiText));
//
//        } catch (Exception e) {
//            System.err.println("Groq API error: " + e.getMessage());
//            return ResponseEntity.status(500)
//                    .body(Map.of("error", "Failed: " + e.getMessage()));
//        }
//    }
//}






package com.academicadvisor.backend.controller;

import com.academicadvisor.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // ── POST /api/ai/chat ─────────────────────────────────────
    // General purpose — used by Career Roadmap, Subject Suggester, Chatbot
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> request) {
        Map<String, String> response = aiService.chat(request);
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        return ResponseEntity.ok(response);
    }

    // ── POST /api/ai/analyze-progress ─────────────────────────
    // Used by Dashboard AI analysis button
    @PostMapping("/analyze-progress")
    public ResponseEntity<Map<String, String>> analyzeProgress(@RequestBody Map<String, Object> data) {
        Map<String, String> response = aiService.analyzeProgress(data);
        if (response.containsKey("error")) {
            return ResponseEntity.status(500).body(response);
        }
        return ResponseEntity.ok(response);
    }
}