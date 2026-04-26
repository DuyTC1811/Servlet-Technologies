package com.example.rbacabac.transaction;

import com.example.rbacabac.auth.dto.LoginRequest;
import com.example.rbacabac.auth.dto.LoginResponse;
import com.example.rbacabac.common.response.ApiResponse;
import com.example.rbacabac.transaction.dto.CreateTransactionRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@DisplayName("Transaction API Integration Tests")
class TransactionApiIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("rbac_abac_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String makerToken;
    private String checkerToken;
    private String viewerToken;

    @BeforeEach
    void setUp() throws Exception {
        makerToken = loginAndGetToken("maker01", "Password@123");
        checkerToken = loginAndGetToken("checker01", "Password@123");
        viewerToken = loginAndGetToken("viewer01", "Password@123");
    }

    @Test
    @DisplayName("POST /transactions - MAKER can create transaction")
    void makerCanCreateTransaction() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setAmount(new BigDecimal("100000000"));
        request.setCurrency("VND");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + makerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"));
    }

    @Test
    @DisplayName("POST /transactions - VIEWER cannot create transaction (403)")
    void viewerCannotCreateTransaction() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setAmount(new BigDecimal("100000000"));
        request.setCurrency("VND");

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /transactions - 401 without token")
    void cannotCreateTransactionWithoutToken() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setAmount(new BigDecimal("100000000"));
        request.setCurrency("VND");

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        ApiResponse<LoginResponse> response = objectMapper.readValue(json,
                new TypeReference<>() {});
        return response.getData().getAccessToken();
    }
}
