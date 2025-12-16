const API_BASE = "https://ai-gohan.onrender.com";

// 共通DOM
const suggestBtn = document.getElementById("suggest-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

/* ===== 入力収集 ===== */

function collectMoods() {
  const buttons = document.querySelectorAll("#mood-buttons button");
  return [...buttons]
    .filter(b => b.classList.contains("active"))
    .map(b => b.dataset.value);
}

function collectIngredients() {
  const buttons = document.querySelectorAll("#ingredient-buttons button");

  const selected = [...buttons]
    .filter(b => b.classList.contains("active"))
    .map(b => b.dataset.value);

  const extraEl = document.getElementById("ingredient-extra");
  const extra = extraEl
    ? extraEl.value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  return [...new Set([...selected, ...extra])];
}

/* ===== ボタンON/OFF ===== */

document.querySelectorAll(".button-group button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
  });
});

/* ===== メイン処理 ===== */

suggestBtn.addEventListener("click", async () => {
  const moods = collectMoods();
  const ingredients = collectIngredients();

  statusEl.textContent = "AIがレシピを考えています…";
  resultEl.innerHTML = "";
  suggestBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moods, ingredients })
    });

    if (!res.ok) throw new Error("APIエラー");

    const data = await res.json();

    if (!data.recipes || data.recipes.length === 0) {
      statusEl.textContent = "レシピが取得できませんでした。";
      return;
    }

    statusEl.textContent = `おすすめレシピ ${data.recipes.length}件`;

    resultEl.innerHTML = data.recipes.map(r => `
      <section class="recipe">
        <h2>${r.title || "タイトル不明"}</h2>
        <div>
          ${(r.mood_tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <p>目安時間: ${r.estimated_time_min || "?"}分</p>
        <h3>材料</h3>
        <ul>${(r.ingredients || []).map(i => `<li>${i}</li>`).join("")}</ul>
        <h3>作り方</h3>
        <ol>${(r.steps || []).map(s => `<li>${s}</li>`).join("")}</ol>
      </section>
    `).join("");

  } catch (err) {
    console.error(err);
    statusEl.textContent = "ごめん…レシピ取得中にエラーが出ちゃった。";
  } finally {
    suggestBtn.disabled = false;
  }
});
