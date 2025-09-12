# matcher.py - embeddings + semantic matching + LLM re-ranker (placeholder)
from sentence_transformers import SentenceTransformer, util
import numpy as np

MODEL_NAME = "all-mpnet-base-v2"

class Matcher:
    def __init__(self, model_name=MODEL_NAME):
        self.model = SentenceTransformer(model_name)

    def embed(self, texts):
        return self.model.encode(texts, convert_to_tensor=True, show_progress_bar=False)

    def semantic_match(self, resume_sentences, jd_sentences, top_k=3):
        emb_resume = self.embed(resume_sentences)
        emb_jd = self.embed(jd_sentences)
        cos_scores = util.cos_sim(emb_jd, emb_resume)
        matches = []
        for i, row in enumerate(cos_scores):
            top_idxs = np.argpartition(-row.cpu().numpy(), range(min(len(resume_sentences), top_k)))[:top_k]
            matches.append({
                "jd_sentence": jd_sentences[i],
                "top_matches": [
                    {"resume_sentence": resume_sentences[int(idx)], "score": float(row[int(idx)].cpu().numpy())}
                    for idx in top_idxs
                ]
            })
        return matches

    def coverage_score(self, resume_sentences, jd_sentences, threshold=0.55):
        emb_resume = self.embed(resume_sentences)
        emb_jd = self.embed(jd_sentences)  # ✅ fixed variable name
        cos_scores = util.cos_sim(emb_jd, emb_resume)
        max_per_jd = cos_scores.max(dim=1).values.cpu().numpy()
        coverage = (max_per_jd > threshold).mean()
        return float(coverage), float(max_per_jd.mean())

    def llm_rerank(self, matches, jd_text, resume_text, provider='openai', api_key=None):
        """Re-rank matches using an instruction-tuned LLM and produce short explanations.
        Placeholder implementation: replace with actual OpenAI/Bedrock call if API key is provided."""
        for m in matches:
            avg = sum([t['score'] for t in m['top_matches']]) / max(len(m['top_matches']), 1)
            m['avg_score'] = avg
            # Craft human-friendly explanation (placeholder)
            m['explanation'] = f"Project evidence matches requirement with avg similarity {avg:.3f}. Suggest quantifying impact and adding metrics."
        matches_sorted = sorted(matches, key=lambda x: x['avg_score'], reverse=True)
        return matches_sorted