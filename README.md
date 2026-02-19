# Tienda Vedruna (Astro)

Frontend e-commerce desarrollado con Astro para la tienda de Vedruna.

## 1. Instalación del proyecto (paso a paso)
###  Requisitos previos
- `Node.js` 18+ y `npm`
- `Java` 17+ y `Maven` (para `login-vedruna`)
- `MySQL` (usado por `login-vedruna`)

#### 1.1 Clonar este repositorio
```bash
git clone https://github.com/VedrunaSevillaDAW/TiendaVedruna.git
cd TiendaVedruna
```

#### 1.2 Instalar dependencias del frontend
```bash
npm install
```

#### 1.3 Crear y configurar `.env`
Usa los valores de ejemplo de la sección **3. Variables de entorno**.

#### 1.4 Levantar el servicio externo de autenticación
Integración con repositorio externo `login-vedruna`**.

#### 1.5 Ejecutar la tienda
```bash
npm run dev
```


#### 1.6 Abrir en navegador
- `http://localhost:4321`

## 2. Stack y arquitectura
- `Astro` como framework principal.
- `Tailwind CSS` para estilos.
- `Printful` como origen de catálogo/productos.
- `simpleCart.js` para carrito en frontend.
- `login-vedruna` (repositorio externo) como servidor de autenticación OAuth2.

Arquitectura por capas:
- UI y páginas: `src/pages`, `src/components`
- Scripts cliente: `src/scripts`
- Utilidades/lib: `src/lib`, `src/utils`
- Endpoints propios (BFF ligero): `src/pages/api`

## 3. Estructura principal
- `src/components/Layout.astro`: layout global, cabecera, footer, panel del carrito.
- `src/pages/index.astro`: home.
- `src/pages/productos.astro`: listado de productos desde Printful.
- `src/pages/wishlist.astro`: favoritos.
- `src/pages/login.astro`: acceso y estado de sesión local.
- `src/scripts/site.ts`: estado global UI (auth/wishlist/carrito/checkout).
- `src/scripts/products-page.ts`: inicialización de tarjetas de producto.
- `src/scripts/product-cards.ts`: variantes, wishlist y add-to-cart.
- `src/scripts/login-page.ts`: iniciar login OAuth y logout local/remoto.
- `src/pages/api/auth/start.ts`: inicio flujo OAuth.
- `src/pages/api/auth/callback.ts`: callback OAuth (token + user info).
- `src/pages/api/products/[id].ts`: precio/detalle de variante.
- `src/pages/api/checkout.ts`: validación de checkout.

## 4. Variables de entorno
Crear `.env` en la raíz:

```env
PRINTFUL_API_KEY=tu_api_key_printful

LOGIN_BASE_URL=http://localhost:9000/
LOGIN_CLIENT_ID=tienda-astro
LOGIN_CLIENT_SECRET=secret
LOGIN_REDIRECT_URI=http://localhost:4321/api/auth/callback
PAYMENT_API_BASE_URL=http://localhost:4242
```

Notas:
- `LOGIN_*` se usan en los endpoints OAuth de Astro.
- El `LOGIN_REDIRECT_URI` debe coincidir exactamente con el registrado en el servidor de auth.
- `PAYMENT_API_BASE_URL` apunta al backend de `plataforma-pago` (Redsys).

## 5. Integración con repositorio externo `login-vedruna`
Este proyecto depende de un servidor externo de autenticación.

### 5.1 Clonar y arrancar `login-vedruna`
Ejemplo:

```bash
git clone https://github.com/VedrunaSevillaDAW/login-vedruna.git
cd login-vedruna
mvn spring-boot:run
```

Debe quedar disponible en:
- `http://localhost:9000`

### 5.2 Registrar cliente OAuth para la tienda
En la base de datos del auth server (`oauth2_registered_client`) debe existir un cliente con:
- `client_id = tienda-astro`
- `client_secret = secret` (bcrypt en DB)
- `redirect_uri = http://localhost:4321/api/auth/callback`
- grant types: `authorization_code,refresh_token`
- auth method: `client_secret_basic`

Sin ese cliente, el login fallará con error de `client_id`.

### 5.3 Flujo de enlace entre ambos proyectos
1. Usuario entra en `http://localhost:4321/login`.
2. Frontend redirige a `GET /api/auth/start`.
3. Ese endpoint redirige a `http://localhost:9000/oauth2/authorize`.
4. Usuario se autentica en `login-vedruna`.
5. `login-vedruna` vuelve a `http://localhost:4321/api/auth/callback?code=...`.
6. `callback.ts` canjea `code` por token y consulta `/api/v1/user/me`.
7. Redirección final a home con usuario logueado en UI.

## 6. Ejecutar en local
1. Levantar `login-vedruna` en `:9000`.
2. Configurar `.env` en esta tienda.
3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar:

```bash
npm run dev
```

5. Abrir:
- `http://localhost:4321`

## 7. Scripts útiles
- `npm run dev`: entorno de desarrollo.
- `npm run build`: build de producción.
- `npm run preview`: previsualizar build.

## 8. Problemas comunes
- Error OAuth `invalid_request client_id`:
  - cliente no registrado en DB o `LOGIN_CLIENT_ID` incorrecto.
- No vuelve al callback:
  - `LOGIN_REDIRECT_URI` no coincide con el redirect URI del cliente OAuth.
- No cargan productos:
  - `PRINTFUL_API_KEY` inválida o faltante.
- Header no refleja usuario:
  - revisar `auth/callback`, localStorage y errores `auth_error` en URL.
- Añadir el siguiente insert en la BB.DD. de login-vedruna:

```bash
INSERT INTO loginvedruna.oauth2_registered_client (
  id,
  client_id,
  client_id_issued_at,
  client_secret,
  client_secret_expires_at,
  client_name,
  client_authentication_methods,
  authorization_grant_types,
  redirect_uris,
  post_logout_redirect_uris,
  scopes,
  client_settings,
  token_settings
) VALUES (
  'c7d7b1f4-2e39-4a8d-8d4b-5f8b2e9a7c11',
  'tienda-astro',
  NOW(),
  '$2a$10$zUZvwU77nLg.46SvIDBKG.AVucefyTc4cJWPj/zRbWzXBtGIwI.9u', -- secret (bcrypt)
  NULL,
  'Tienda Astro',
  'client_secret_basic',
  'refresh_token,authorization_code',
  'http://localhost:4321/api/auth/callback',
  '',
  'openid,profile,email,api',
  '{"@class":"java.util.Collections$UnmodifiableMap","settings.client.require-proof-key":false,"settings.client.require-authorization-consent":false}',
  '{"@class":"java.util.Collections$UnmodifiableMap","settings.token.reuse-refresh-tokens":true,"settings.token.x509-certificate-bound-access-tokens":false,"settings.token.id-token-signature-algorithm":["org.springframework.security.oauth2.jose.jws.SignatureAlgorithm","RS256"],"settings.token.access-token-time-to-live":["java.time.Duration",300.000000000],"settings.token.access-token-format":{"@class":"org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat","value":"self-contained"},"settings.token.refresh-token-time-to-live":["java.time.Duration",3600.000000000],"settings.token.authorization-code-time-to-live":["java.time.Duration",300.000000000],"settings.token.device-code-time-to-live":["java.time.Duration",300.000000000]}'
);
```

## 9. Estado actual del login/registro
- Login se hace vía OAuth contra `login-vedruna`.
- Registro de usuario se realiza en el auth server externo (`:9000/register`).

## 10. Cambios recientes (carrito/login/pago)
- Carrito restringido a usuarios logueados:
  - El icono y acciones protegidas usan `data-auth-required`.
  - Si no hay sesión (`localStorage.username`), no se permite añadir al carrito ni iniciar checkout.
- Flujo de pago conectado con `plataforma-pago`:
  - `src/pages/api/checkout.ts` crea el pago real en Redsys.
  - `src/pages/api/checkout/status/[id].ts` consulta estado de orden.
  - `src/pages/pago/ok.astro` y `src/pages/pago/ko.astro` gestionan retorno.
- Ajuste recomendado en `login-vedruna` para evitar redirecciones técnicas:
  - Archivo: `login-vedruna/src/main/java/com/vedruna/login/config/VaadinSecurityConfig.java`.
  - El `successHandler` debe descartar rutas tipo `/.well-known/...` y, en ese caso,
    redirigir a `http://localhost:4321/api/auth/start` para completar OAuth y cargar usuario.

## 12. Integración con repositorio externo `plataforma-pago`
Este proyecto depende de un servidor externo de pasarela de pago para procesar compras.

### 12.1 Clonar y arrancar `plataforma-pago`
Ejemplo:

```bash
git clone https://github.com/VedrunaSevillaDAW/plataforma-pago.git
cd plataforma-pago
mvn spring-boot:run
```

Debe quedar disponible en:
- `http://localhost:4242`

### 12.2 Configuración para la tienda
En la tienda (`TiendaVedruna`), define en `.env`:

```env
PAYMENT_API_BASE_URL=http://localhost:4242
```

Notas:
- `PAYMENT_API_BASE_URL` es la base del backend de pago usado por `src/pages/api/checkout.ts`.
- La pasarela procesa el alta del pago y devuelve los parámetros firmados de Redsys.

### 12.3 Flujo de enlace entre ambos proyectos
1. Usuario autenticado añade productos al carrito.
2. Frontend llama a `POST /api/checkout` (Astro).
3. Astro crea la orden en `plataforma-pago` con `POST /api/redsys/payment`.
4. Se redirige al formulario de Redsys con firma (`Ds_*`).
5. Redsys devuelve el resultado (OK/KO) y la orden se actualiza.
6. Al volver al frontend, el carrito se limpia cuando el pago queda confirmado.

### 12.4 Ejecución local conjunta recomendada
1. Levanta `login-vedruna` en `:9000`.
2. Levanta `plataforma-pago` en `:4242`.
3. Ejecuta la tienda en `:4321` (`npm run dev`).
4. Prueba login, añade productos al carrito y completa checkout.

### 12.5 Tarjetas de prueba Redsys (sandbox)

- VISA: `4548 8100 0000 0003`
- Mastercard: `5576 4415 6304 5037`
- Caducidad: `12/49`
- CVV: `123`

Solo válidas en entorno de pruebas Redsys.
