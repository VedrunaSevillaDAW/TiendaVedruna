# Migracion de TiendaVedruna (Next.js) a tienda_astro (Astro puro)

Este README documenta, paso a paso, como se ha realizado la migracion del proyecto Next.js original en
`C:\Users\tlomba\Documents\Tienda\TiendaVedruna` a un proyecto Astro puro en
`C:\Users\tlomba\Documents\Tienda\tienda_astro`.

## 0) Objetivo

- Migrar el frontend a Astro *puro* (sin React en runtime).
- Mantener integraciones con Printful y Snipcart.
- Mantener login/registro con Firebase.
- Mantener wishlist, filtros y contador del carrito en JS vanilla.

## 1) Crear el proyecto Astro en carpeta nueva

Se creo el proyecto Astro fuera del repo original, en:

```
C:\Users\tlomba\Documents\Tienda\tienda_astro
```

Comandos usados:

```
npm create astro@latest tienda_astro -- --template minimal --typescript strict --install --no-git
```

Notas:
- El primer intento dentro de `TiendaVedruna` se elimino.
- El comando se ejecuto por `cmd` porque PowerShell tenia la policy de scripts bloqueada.

## 2) Instalar Tailwind y plugins

Instalacion de Tailwind para Astro:

```
npx astro add tailwind --yes
```

Plugins del proyecto original:

```
npm i @tailwindcss/forms @tailwindcss/typography
```

Y se configuro `src/styles/global.css` con:

```
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";
```

## 3) Copiar assets publicos

Se copiaron los assets de `public/` del proyecto Next:

```
Copy-Item -Recurse -Force "C:\Users\tlomba\Documents\Tienda\TiendaVedruna\public\*" "C:\Users\tlomba\Documents\Tienda\tienda_astro\public"
```

## 4) Estructura de carpetas

Se crearon carpetas equivalentes en Astro:

```
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\components
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\layouts
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\lib
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\pages\api\products
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\pages\api\snipcart
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\scripts
C:\Users\tlomba\Documents\Tienda\tienda_astro\src\utils
```

## 5) Layout global y Snipcart

En Next el layout global y scripts estaban en `_app.tsx` y `_document.tsx`.
Se movieron a un layout de Astro:

Archivo:

```
src/layouts/Base.astro
```

Incluye:
- Layout de header/footer
- Snipcart CSS y JS
- `#snipcart` con `data-api-key`
- Import de estilos globales

## 6) CSS de Snipcart

El CSS de Snipcart se migro a:

```
src/styles/app.css
```

Y se importa en `Base.astro`.

## 7) Migracion de logica Printful

Se crearon estos archivos equivalentes:

```
src/lib/printful-client.ts
src/lib/format-variant-name.ts
src/lib/create-order.ts
```

En Astro la variable de entorno se lee con:

```
import.meta.env.PRINTFUL_API_KEY
```

## 8) Variables de entorno

Se creo un `.env` en el proyecto Astro:

```
PRINTFUL_API_KEY=REPLACE_WITH_YOUR_PRINTFUL_TOKEN
PUBLIC_SNIPCART_API_KEY=REPLACE_WITH_YOUR_SNIPCART_KEY
```

`PUBLIC_SNIPCART_API_KEY` es publica y se usa en cliente.

## 9) Migracion de paginas

### Home

Archivo:

```
src/pages/index.astro
```

Cambios:
- `getStaticProps` se reemplazo por frontmatter y `await` directo en Astro.
- El grid de productos se reescribio en HTML de Astro.
- Se agrego script `home-page.ts` para filtros, wishlist y variantes.

### About y Terms

Archivos:

```
src/pages/about.astro
src/pages/terms-of-sale.astro
```

Se copio el contenido y se adapto a HTML de Astro.

### Wishlist

Archivo:

```
src/pages/wishlist.astro
```

Se renderiza vacio en server y se completa en cliente con JS.

### Login y Register

Archivos:

```
src/pages/login.astro
src/pages/register.astro
```

Login/registro se reescribio en JS vanilla (sin React hooks) usando Firebase.

## 10) Scripts JS (sin React)

### wishlist-store.ts
- Maneja localStorage con `items-wishlist`.

### product-cards.ts
- Cambia variante seleccionada.
- Actualiza precio/imagen.
- Maneja boton wishlist.

### home-page.ts
- Inicializa productos y filtro en home.

### wishlist-page.ts
- Renderiza wishlist en HTML dinamico.
- Actualiza al cambiar wishlist.

### site.ts
- Actualiza estado de login/logout en header.
- Muestra/oculta indicadores de wishlist/carrito.
- Conecta con Snipcart store.

### login-page.ts y register-page.ts
- Manejan login y registro con Firebase.
- Guardan `username` en localStorage.

## 11) Migracion de API routes

En Astro se usan endpoints `APIRoute`.
Se migraron:

```
src/pages/api/products/[id].ts
src/pages/api/snipcart/shipping.ts
src/pages/api/snipcart/tax.ts
src/pages/api/snipcart/webhook.ts
```

## 12) Adapter Node para endpoints

Para que Astro soporte endpoints en build, se instalo:

```
npm i @astrojs/node
```

Y se actualizo `astro.config.mjs`:

```
output: 'server'
adapter: node({ mode: 'standalone' })
```

## 13) Dependencias finales

Las dependencias principales quedaron:

- astro
- tailwindcss
- @tailwindcss/forms
- @tailwindcss/typography
- printful-request
- lodash.shuffle
- firebase
- @astrojs/node

## 14) Como ejecutar

1. Edita `.env` y pon tus claves reales:

```
PRINTFUL_API_KEY=TU_TOKEN
PUBLIC_SNIPCART_API_KEY=TU_KEY
```

2. Ejecuta:

```
cd C:\Users\tlomba\Documents\Tienda\tienda_astro
npm run dev
```

3. Abre:

```
http://localhost:4321
```

## 15) Consideraciones

- Login, wishlist y filtros se hacen 100% en JS vanilla.
- Los endpoints de Printful requieren API key valida.
- Snipcart usa el atributo `data-api-key` con `PUBLIC_SNIPCART_API_KEY`.

## 16) Problemas comunes

- Si no carga la home: revisar `PRINTFUL_API_KEY`.
- Si Snipcart no abre: revisar `PUBLIC_SNIPCART_API_KEY`.
- Si login falla: revisar configuracion de Firebase.

---

Si necesitas extender la migracion (tests, SEO, analytics, SSR avanzado), se puede ampliar desde aqui.