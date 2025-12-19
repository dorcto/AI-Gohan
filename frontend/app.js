const API_BASE = "https://ai-gohan.onrender.com";

const suggestBtn = document.getElementById("suggest-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

function collectMoods() {
  const buttons = document.querySelectorAll("#mood-buttons button");
  return [...buttons]
    .filter(b => b.classList.contains("is-selected"))
    .map(b => b.dataset.value);
}

function collectStaple() {
  const buttons = document.querySelectorAll("#main-food-buttons button");
  const active = [...buttons].find(b => b.classList.contains("is-radio-selected"));
  return active ? active.dataset.value : "";
}

function collectIngredients() {
  const extraEl = document.getElementById("ingredient-extra");
  const extra = extraEl
    ? extraEl.value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];
  return extra;
}

// 気分ボタンの処理（複数選択可）
document.querySelectorAll("#mood-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("is-selected");
  });
});

// 主食ボタンの処理（単一選択）
document.querySelectorAll("#main-food-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    const wasActive = btn.classList.contains("is-radio-selected");
    document.querySelectorAll("#main-food-buttons button").forEach(b => {
      b.classList.remove("is-radio-selected");
    });
    if (!wasActive) {
      btn.classList.add("is-radio-selected");
    }
  });
});

suggestBtn.addEventListener("click", async () => {
  const moods = collectMoods();
  const staple = collectStaple();
  const ingredients = collectIngredients();

  statusEl.textContent = "AIがレシピを考えています…";
  resultEl.innerHTML = "";
  suggestBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moods, staple, ingredients })
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
