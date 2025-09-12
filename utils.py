
# utils.py - helpers for LLM calls, rewrite, PR snapshot, hireability, GitHub scan
import os, json
def call_openai(prompt, api_key=None, max_tokens=250):
    key = api_key or os.environ.get('OPENAI_API_KEY')
    if not key:
        return '[LLM API KEY MISSING]'
    import openai
    openai.api_key = key
    resp = openai.Completion.create(model='text-davinci-003', prompt=prompt, max_tokens=max_tokens, temperature=0.2)
    return resp.choices[0].text.strip()

def rewrite_bullets_using_llm(bullets, api_key=None):
    if isinstance(bullets, list):
        text = '\n'.join(bullets)
    else:
        text = bullets
    prompt = f"Rewrite these experience bullets to be impact-first and quantified if possible:\n\n{text}\n\nOutput bullet list:"
    return call_openai(prompt, api_key=api_key)

def generate_pr_snapshot(resume_text, report, api_key=None):
    top_projects = [m.get('jd_sentence','') for m in report.get('matches',[])][:3]
    skills = report.get('skills_found',[])[:5]
    pitch = 'Data Scientist with hands-on Generative AI and production ML skills.'
    snapshot = {'pitch': pitch, 'top_projects': top_projects, 'top_skills': skills, 'questions': report.get('interview_questions',[])[:5]}
    return snapshot

def compute_hireability_score(report):
    coverage = report.get('coverage_score',0)
    missing = len(report.get('missing_skills',[]))
    score = max(0, min(100, int(coverage*100 - missing*4 + 50)))
    tips = []
    if score < 60:
        tips.append('Acquire missing core skills; build 1-2 targeted projects.')
    else:
        tips.append('Polish bullets with metrics and prepare system/ML interviews.')
    return score, tips

def github_quick_scan(github_url, jd_text):
    return {'matched_files': [], 'notes':'Implement using GitHub API to search repo for JD keywords.'}
