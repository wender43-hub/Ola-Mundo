package src;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/**
 * Sabora — backend de demonstração.
 *
 * Servidor HTTP feito só com a biblioteca padrão do Java (sem Maven,
 * sem Spring, sem dependências externas) para rodar com:
 *
 *   javac Main.java
 *   java Main
 *
 * Ele expõe uma API REST simples em /api/* e também serve os
 * arquivos do front-end (pasta ../frontend) na raiz "/".
 *
 * IMPORTANTE: isso é um projeto de estudo/demonstração. Para produção
 * seria preciso adicionar banco de dados, autenticação, sessões por
 * usuário, validação e tratamento de erros mais robusto.
 */
public class Main {

    // ---------- Modelo ----------
    static class Product {
        String id, name, category, emoji, tag, desc;
        double price;
        Product(String id, String name, String category, double price, String emoji, String tag, String desc) {
            this.id = id; this.name = name; this.category = category;
            this.price = price; this.emoji = emoji; this.tag = tag; this.desc = desc;
        }
        String toJson() {
            return "{"
                + "\"id\":\"" + esc(id) + "\","
                + "\"name\":\"" + esc(name) + "\","
                + "\"category\":\"" + esc(category) + "\","
                + "\"price\":" + price + ","
                + "\"emoji\":\"" + esc(emoji) + "\","
                + "\"tag\":\"" + esc(tag) + "\","
                + "\"desc\":\"" + esc(desc) + "\""
                + "}";
        }
    }

    // Catálogo em memória (poderia vir de um banco de dados)
    static final List<Product> PRODUCTS = new ArrayList<>(List.of(
        new Product("p1", "Risoto de cogumelos selvagens", "populares", 42.90, "🍄", "Destaque", "Arbóreo cremoso com funghi salteados na manteiga e parmesão curado."),
        new Product("p2", "Hambúrguer artesanal smash", "populares", 34.50, "🍔", "Mais vendido", "Dois blends de 90g, queijo cheddar derretido e molho da casa."),
        new Product("p3", "Poke de salmão", "populares", 38.00, "🍣", "Leve", "Salmão fresco, edamame, manga e molho shoyu com gergelim."),
        new Product("p4", "Feijoada completa", "salgados", 46.00, "🍲", "Tradição", "Feijoada com acompanhamentos clássicos e couve refogada."),
        new Product("p5", "Massa ao molho pesto", "salgados", 32.90, "🍝", "Vegetariano", "Fettuccine fresco com pesto de manjericão e castanhas."),
        new Product("p6", "Tacos de carne assada", "salgados", 29.90, "🌮", "Picante", "Três tacos com carne desfiada, pico de gallo e guacamole."),
        new Product("p7", "Pizza margherita", "salgados", 39.90, "🍕", "Clássico", "Massa fermentada 48h, molho de tomate San Marzano e manjericão."),
        new Product("p8", "Petit gâteau", "sobremesas", 22.00, "🍫", "Quentinho", "Bolo de chocolate com recheio cremoso e sorvete de creme."),
        new Product("p9", "Cheesecake de frutas vermelhas", "sobremesas", 19.90, "🍰", "Favorito", "Base amanteigada, creme de queijo e calda de frutas vermelhas."),
        new Product("p10", "Sorvete artesanal", "sobremesas", 16.50, "🍨", "Refrescante", "Três bolas de sorvete cremoso, sabores rotativos da semana."),
        new Product("p11", "Suco natural de laranja", "bebidas", 9.90, "🍊", "Vitamina C", "Laranjas espremidas na hora, sem adição de açúcar."),
        new Product("p12", "Café coado especial", "bebidas", 8.50, "☕", "Origem única", "Grãos torrados artesanalmente, moídos na hora do pedido."),
        new Product("p13", "Limonada suíça", "bebidas", 10.90, "🍋", "Refrescante", "Limão siciliano batido com leite condensado e gelo.")
    ));

    // Carrinho global simples (demonstração). Em produção: 1 carrinho por usuário/sessão.
    static final Map<String, Integer> CART = new ConcurrentHashMap<>();

    // Pasta do front-end, resolvida de forma flexível conforme o diretório
    // a partir de onde o comando "java Main" for executado.
    static Path FRONTEND_DIR = resolveFrontendDir();

    static Path resolveFrontendDir() {
        String[] candidates = { "../frontend", "../../frontend", "frontend" };
        for (String c : candidates) {
            Path p = Paths.get(c).normalize().toAbsolutePath();
            if (Files.isDirectory(p) && Files.exists(p.resolve("index.html"))) return p;
        }
        // fallback: assume "backend/src" -> "../../frontend"
        return Paths.get("../../frontend").normalize().toAbsolutePath();
    }

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/products", Main::handleProducts);
        server.createContext("/api/categories", Main::handleCategories);
        server.createContext("/api/cart", Main::handleCart);
        server.createContext("/", Main::handleStatic);

        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("Sabora backend rodando em http://localhost:" + port);
        System.out.println("API:      http://localhost:" + port + "/api/products");
        System.out.println("Frontend: http://localhost:" + port + "/");
    }

    // ---------- /api/products ----------
    static void handleProducts(HttpExchange ex) throws IOException {
        if (preflight(ex)) return;
        if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) { send(ex, 405, "application/json", "{\"error\":\"método não suportado\"}"); return; }

        String query = ex.getRequestURI().getQuery();
        String category = paramValue(query, "category");

        StringBuilder json = new StringBuilder("[");
        boolean first = true;
        for (Product p : PRODUCTS) {
            if (category != null && !category.isBlank() && !p.category.equalsIgnoreCase(category)) continue;
            if (!first) json.append(",");
            json.append(p.toJson());
            first = false;
        }
        json.append("]");
        send(ex, 200, "application/json", json.toString());
    }

    // ---------- /api/categories ----------
    static void handleCategories(HttpExchange ex) throws IOException {
        if (preflight(ex)) return;
        LinkedHashSet<String> cats = new LinkedHashSet<>();
        for (Product p : PRODUCTS) cats.add(p.category);
        StringBuilder json = new StringBuilder("[");
        boolean first = true;
        for (String c : cats) {
            if (!first) json.append(",");
            json.append("\"").append(esc(c)).append("\"");
            first = false;
        }
        json.append("]");
        send(ex, 200, "application/json", json.toString());
    }

    // ---------- /api/cart ----------
    static void handleCart(HttpExchange ex) throws IOException {
        if (preflight(ex)) return;
        String method = ex.getRequestMethod();

        if ("GET".equalsIgnoreCase(method)) {
            send(ex, 200, "application/json", cartJson());
            return;
        }

        if ("POST".equalsIgnoreCase(method)) {
            String body = readBody(ex);
            String productId = jsonStringValue(body, "productId");
            int qty = jsonIntValue(body, "qty", 1);
            if (productId == null || findProduct(productId) == null) {
                send(ex, 400, "application/json", "{\"error\":\"productId inválido\"}");
                return;
            }
            CART.merge(productId, qty, Integer::sum);
            send(ex, 200, "application/json", cartJson());
            return;
        }

        if ("DELETE".equalsIgnoreCase(method)) {
            String path = ex.getRequestURI().getPath(); // /api/cart/p1
            String id = path.replaceFirst("^/api/cart/?", "");
            if (!id.isBlank()) CART.remove(id);
            send(ex, 200, "application/json", cartJson());
            return;
        }

        send(ex, 405, "application/json", "{\"error\":\"método não suportado\"}");
    }

    static String cartJson() {
        StringBuilder json = new StringBuilder("{\"items\":[");
        boolean first = true;
        double total = 0;
        for (Map.Entry<String, Integer> e : CART.entrySet()) {
            Product p = findProduct(e.getKey());
            if (p == null) continue;
            if (!first) json.append(",");
            json.append("{\"productId\":\"").append(esc(p.id)).append("\",")
                .append("\"qty\":").append(e.getValue()).append(",")
                .append("\"product\":").append(p.toJson())
                .append("}");
            total += p.price * e.getValue();
            first = false;
        }
        json.append("],\"total\":").append(total).append("}");
        return json.toString();
    }

    static Product findProduct(String id) {
        for (Product p : PRODUCTS) if (p.id.equals(id)) return p;
        return null;
    }

    // ---------- Arquivos estáticos do front-end ----------
    static void handleStatic(HttpExchange ex) throws IOException {
        if (preflight(ex)) return;
        String reqPath = ex.getRequestURI().getPath();
        if (reqPath.equals("/")) reqPath = "/index.html";

        Path file = FRONTEND_DIR.resolve("." + reqPath).normalize();

        // segurança: impedir sair da pasta frontend
        if (!file.startsWith(FRONTEND_DIR) || !Files.exists(file) || Files.isDirectory(file)) {
            file = FRONTEND_DIR.resolve("index.html");
        }

        byte[] bytes = Files.readAllBytes(file);
        send(ex, 200, contentType(file.toString()), bytes);
    }

    static String contentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=utf-8";
        if (path.endsWith(".css")) return "text/css; charset=utf-8";
        if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (path.endsWith(".json")) return "application/json; charset=utf-8";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    // ---------- Utilidades HTTP ----------
    static boolean preflight(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    static void send(HttpExchange ex, int status, String contentType, String body) throws IOException {
        send(ex, status, contentType, body.getBytes(StandardCharsets.UTF_8));
    }

    static void send(HttpExchange ex, int status, String contentType, byte[] body) throws IOException {
        ex.getResponseHeaders().set("Content-Type", contentType);
        ex.sendResponseHeaders(status, body.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(body); }
    }

    static String readBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    static String paramValue(String query, String key) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) return kv[1];
        }
        return null;
    }

    // Extração simples de valores de um JSON "achatado" (suficiente para este projeto de demo)
    static String jsonStringValue(String json, String key) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }
    static int jsonIntValue(String json, String key, int fallback) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(\\d+)").matcher(json);
        return m.find() ? Integer.parseInt(m.group(1)) : fallback;
    }

    static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}