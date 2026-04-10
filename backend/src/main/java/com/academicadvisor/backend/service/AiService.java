package com.academicadvisor.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    private final RestTemplate restTemplate;

    public AiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(20000);
        factory.setReadTimeout(90000);
        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, String> chat(Map<String, Object> request) {
        String message = (String) request.getOrDefault("message", "");
        String system = (String) request.getOrDefault("system", "You are a helpful academic advisor.");
        String feature = (String) request.getOrDefault("feature", "general");
        int maxTokens = 4096;

        if (request.containsKey("max_tokens")) {
            try {
                maxTokens = Integer.parseInt(request.get("max_tokens").toString());
            } catch (NumberFormatException ignored) {
            }
        }

        return callHybrid(feature, system, message, "response", maxTokens);
    }

    public Map<String, String> analyzeProgress(Map<String, Object> data) {
        String system = """
                You are an academic performance advisor.
                Analyze the student's attendance and CGPA data.
                Provide specific, actionable insights and encouragement.
                Keep your response concise and friendly.
                """;

        String message = String.format("""
                Analyze this student's academic performance:
                - Overall Attendance: %s%%
                - Current CGPA: %s
                - Department: %s
                - Semester: %s

                Provide:
                1. A brief performance summary
                2. Key areas of concern (if any)
                3. Specific actionable advice
                4. An encouraging message
                """,
                data.get("attendance"),
                data.get("cgpa"),
                data.get("department"),
                data.get("semester"));
        return callHybrid("progress_feedback", system, message, "analysis", 4096);
    }

    private Map<String, String> callHybrid(String feature, String system, String message, String responseKey,
            int maxTokens) {
        boolean isGeminiPrimary = "subject_recommendation".equalsIgnoreCase(feature)
                || "career_roadmap".equalsIgnoreCase(feature);

        if (isGeminiPrimary) {
            // Priority 1: Gemini
            Map<String, String> result = callGemini(system, message, responseKey, maxTokens);
            if (!result.containsKey("error"))
                return result;

            // Do not fallback to Groq for subject_recommendation
            if ("subject_recommendation".equalsIgnoreCase(feature)) {
                return result;
            }

            // Fallback: Groq
            System.err.println("Gemini failed for " + feature + ", falling back to Groq: " + result.get("error"));
            return callGroq(system, message, responseKey, maxTokens);
        } else {
            // Priority 1: Groq
            Map<String, String> result = callGroq(system, message, responseKey, maxTokens);
            if (!result.containsKey("error"))
                return result;

            // Fallback: Gemini
            System.err.println("Groq failed for " + feature + ", falling back to Gemini: " + result.get("error"));
            return callGemini(system, message, responseKey, maxTokens);
        }
    }

    private Map<String, String> callGroq(String system, String userMessage, String responseKey, int maxTokens) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", userMessage)),
                "temperature", 0.3,
                "max_tokens", maxTokens);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("choices")) {
                return Map.of("error", "No choices in Groq response");
            }

            List<?> choices = (List<?>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                return Map.of("error", "Empty choices in Groq response");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
            if (message == null || !message.containsKey("content")) {
                return Map.of("error", "No content in Groq message");
            }

            String aiText = (String) message.get("content");
            return Map.of(responseKey, aiText);

        } catch (Exception e) {
            return Map.of("error", "Groq Error: " + e.getMessage());
        }
    }

    private Map<String, String> callGemini(String system, String userMessage, String responseKey, int maxTokens) {
        if ("YOUR_GEMINI_API_KEY_HERE".equals(geminiApiKey) || geminiApiKey == null || geminiApiKey.isEmpty()) {
            return Map.of("error", "Gemini API key not configured");
        }

        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey);

        // Gemini 1.5 supports system instruction. We prepend it to prompt for maximum
        // compatibility or use specific field
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text",
                                        String.format("System Instructions:\n%s\n\nUser Query:\n%s", system,
                                                userMessage))))),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", maxTokens));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("candidates")) {
                return Map.of("error", "No candidates in Gemini response");
            }

            List<?> candidates = (List<?>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return Map.of("error", "Empty candidates in Gemini response");
            }

            Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
            if (content == null || !content.containsKey("parts")) {
                return Map.of("error", "No content/parts in Gemini candidate");
            }

            List<?> parts = (List<?>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return Map.of("error", "Empty parts in Gemini candidate");
            }

            Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
            String aiText = (String) firstPart.get("text");

            return Map.of(responseKey, aiText);

        } catch (Exception e) {
            return Map.of("error", "Gemini Error: " + e.getMessage());
        }
    }
}
