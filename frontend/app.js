const API_BASE = "https://ai-gohan.onrender.com";

// 共通DOM
const suggestBtn = document.getElementById("suggest-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

/* ===== ボタンON/OFF（グループ別） ===== */

// 気分：複数選択
document.querySelectorAll("#mood-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("is-selected");
  });
});

// 主食：単一選択
document.querySelectorAll("#main-food-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#main-food-buttons button")
      .forEach(b => b.classList.remove("is-radio-selected"));
    btn.classList.add("is-radio-selected");
  });
});

// 食材ボタン：使うなら複数選択
document.querySelectorAll("#ingredient-buttons button")?.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("is-selected");
  });
});

/* ===== 入力収集 ===== */

function collectMoods() {
  const buttons = document.querySelectorAll("#mood-buttons button");
  return [...buttons]
    .filter(b => b.classList.contains("is-selected"))
    .map(b => b.dataset.value);
}

function collectMainFood() {
  const selected = document.querySelector("#main-food-buttons button.is-radio-selected");
  return selected ? selected.dataset.value : null;
}

function collectIngredients() {
  const buttons = document.querySelectorAll("#ingredient-buttons button");

  const selected = [...buttons]
    .filter(b => b.classList.contains("is-selected"))
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

/* ===== メイン処理 ===== */

suggestBtn.addEventListener("click", async () => {
  const moods = collectMoods();
  const ingredients = collectIngredients();
  const mainFood = collectMainFood(); // 必要なら使う

  statusEl.textContent = "AIがレシピを考えています…";
  resultEl.innerHTML = "";
  suggestBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moods, ingredients, mainFood })
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
