from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

from google import genai
from google.genai import types

# --- Gemini クライアント ---
# GEMINI_API_KEY 環境変数を自動で読んでくれる
client = genai.Client()

app = FastAPI()

# CORS（開発用に全開放）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ フロントに合わせたリクエストモデル
class SuggestRequest(BaseModel):
    # フロントから来る "moods": ["さっぱり系", "ヘルシー", ...]
    moods: List[str]                     # 空リストもOK

    # フロントから来る "ingredients": ["鶏むね肉", "キャベツ", ...]
    ingredients: List[str]               # 空リストもOK

    # フロントから来る "mainFood": "ご飯" / "麺類" / "パン" / 送られない
    mainFood: Optional[str] = None       # なくてもOK


@app.get("/")
async def root():
    return {"status": "ok"}


@app.post("/api/suggest")
async def suggest_recipe(req: SuggestRequest):
    # ✅ moods / ingredients / mainFood をテキストに整形
    mood_text = "・".join(req.moods) if req.moods else "特に指定なし"
    ingredient_text = ", ".join(req.ingredients) if req.ingredients else "特になし"
    main_food_text = req.mainFood or "特に指定なし"

    prompt = f"""
あなたは日本の家庭向けの料理レシピアシスタントです。

ユーザー情報:
- 今日の気分: {mood_text}
- 主食の希望: {main_food_text}
- 使える食材: {ingredient_text}

条件:
- 30分前後で作れる晩ごはん向けのおかずを3品考えてください。
- 調味料（塩・こしょう・醤油・みりん・砂糖・酒・油など）は家にある前提でOKです。
- できればユーザーの食材をうまく使ってください。足りない食材を使ってもOKですが、その場合は分かりやすく書いてください。
- 日本語で書いてください。

出力フォーマット:
必ず次のJSONだけを返してください。コメントや説明、文章は一切書かないでください。

{{
  "recipes": [
    {{
      "title": "レシピ名",
      "mood_tags": ["タグ1", "タグ2"],
      "estimated_time_min": 20,
      "ingredients": ["材料1 分量", "材料2 分量"],
      "steps": ["手順1", "手順2", "手順3"],
      "reference_urls": ["https://example.com/..."]
    }}
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
            },
        )

        # 生のテキストを取得
        text = response.text
        print("=== Gemini raw response ===")
        print(text)

        # まずは素直にパースを試みる
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # そのままでは失敗した場合、先頭の { から最後の } までを抜き出して再トライ
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end == -1:
                # どう見てもJSONっぽくない
                raise

            json_str = text[start:end+1]
            print("=== Trimmed JSON string ===")
            print(json_str)
            data = json.loads(json_str)

        if "recipes" not in data:
            raise ValueError("JSONに 'recipes' キーが含まれていません。")

        return data

    except Exception as e:
        print("Gemini API error:", e)
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
