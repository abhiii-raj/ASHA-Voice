package in.ashavoice.security;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final TokenService tokenService;
    private final String workerPassword;
    private final String supervisorPassword;

    public AuthController(
        TokenService tokenService,
        @Value("${asha.demo.worker-password}") String workerPassword,
        @Value("${asha.demo.supervisor-password}") String supervisorPassword
    ) {
        this.tokenService = tokenService;
        this.workerPassword = workerPassword;
        this.supervisorPassword = supervisorPassword;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        if ("worker-demo".equals(request.username()) && workerPassword.equals(request.password())) {
            return Map.of("token", tokenService.issue("w1", "WORKER"), "role", "worker");
        }
        if ("supervisor-demo".equals(request.username()) && supervisorPassword.equals(request.password())) {
            return Map.of("token", tokenService.issue("supervisor-demo", "SUPERVISOR"), "role", "supervisor");
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }

    public record LoginRequest(String username, String password) {}
}
