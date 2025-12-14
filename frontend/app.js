const API_BASE = "http://127.0.0.1:8000"; // backendのURL

const moodEl = document.getElementById("mood");
const ingredientsEl = document.getElementById("ingredients");
const suggestBtn = document.getElementById("suggest-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

suggestBtn.addEventListener("click", async () => {
  const mood = moodEl.value;
  const ingredientsText = ingredientsEl.value;

  const ingredients = ingredientsText
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  statusEl.textContent = "AIがレシピを考えています…";
  resultEl.innerHTML = "";
  suggestBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, ingredients })
    });

    if (!res.ok) {
      throw new Error("APIエラー");
    }

    const data = await res.json();

    if (!data.recipes || data.recipes.length === 0) {
      statusEl.textContent = "レシピが取得できませんでした。条件を変えて試してみてください。";
      return;
    }

    statusEl.textContent = `おすすめレシピ ${data.recipes.length}件`;

    resultEl.innerHTML = data.recipes.map(r => {
      const tags = (r.mood_tags || [])
        .map(tag => `<span class="tag">${tag}</span>`)
        .join("");

      const ingredientsHtml = (r.ingredients || [])
        .map(i => `<li>${i}</li>`)
        .join("");

      const stepsHtml = (r.steps || [])
        .map(s => `<li>${s}</li>`)
        .join("");

      const urlsHtml = (r.reference_urls || [])
        .map(u => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a></li>`)
        .join("");

      return `
        <section class="recipe">
          <h2>${r.title || "タイトル不明"}</h2>
          <div>${tags}</div>
          <p>目安時間: ${r.estimated_time_min || "?"}分</p>
          <h3>材料</h3>
          <ul>${ingredientsHtml}</ul>
          <h3>作り方</h3>
          <ol>${stepsHtml}</ol>
          ${urlsHtml ? `<h3>参考URL</h3><ul>${urlsHtml}</ul>` : ""}
        </section>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "ごめん…レシピ取得中にエラーが出ちゃった。";
  } finally {
    suggestBtn.disabled = false;
  }
});
