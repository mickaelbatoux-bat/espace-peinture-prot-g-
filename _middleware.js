// functions/_middleware.js
// Cette fonction s'exécute AVANT de servir le site.
// Le mot de passe est stocké comme variable d'environnement (SITE_PASSWORD)
// sur Cloudflare, donc il n'apparaît JAMAIS dans le code source visible.

const COOKIE_NAME = "btpcfa_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accès protégé — BTP CFA</title>
<style>
  body{font-family:-apple-system,Inter,sans-serif;background:#0C2D4A;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:1.5rem}
  .card{background:#fff;border-radius:16px;padding:2rem;width:100%;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.25);text-align:center}
  h1{font-size:18px;color:#1A1A2E;margin-bottom:6px}
  p{font-size:13px;color:#6B7280;margin-bottom:1.5rem}
  input{width:100%;box-sizing:border-box;border:1.5px solid #E5E7EB;border-radius:8px;padding:12px;font-size:16px;text-align:center;letter-spacing:3px;margin-bottom:1rem}
  button{width:100%;padding:13px;background:#E8A000;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer}
  .err{color:#DC2626;font-size:12px;margin-top:8px}
</style>
</head>
<body>
  <form method="POST" class="card">
    <h1>Espace Peinture — BTP CFA</h1>
    <p>Accès protégé. Entrez le mot de passe.</p>
    <input type="password" name="password" placeholder="Mot de passe" autofocus required>
    <button type="submit">Accéder au site</button>
    ${error ? `<div class="err">Mot de passe incorrect.</div>` : ""}
  </form>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const cookie = request.headers.get("Cookie") || "";
  const isAuthed = cookie.includes(`${COOKIE_NAME}=valid`);

  if (isAuthed) {
    return next();
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === env.SITE_PASSWORD) {
      const response = await next();
      const newResponse = new Response(response.body, response);
      newResponse.headers.append(
        "Set-Cookie",
        `${COOKIE_NAME}=valid; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
      );
      return newResponse;
    }

    return new Response(loginPage(true), {
      status: 401,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  return new Response(loginPage(false), {
    status: 401,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
