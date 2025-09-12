# Streamlit app - Futuristic Resume Analyzer
import streamlit as st
from parser import parse_resume
from report import build_report
from utils import rewrite_bullets_using_llm, generate_pr_snapshot, compute_hireability_score
import tempfile, os, json, time

# ---- Page Setup ----
st.set_page_config(page_title='AI Resume Analyzer', layout='wide')
st.markdown(
    """
    <style>
    body {
        background: linear-gradient(120deg, #e0f7fa, #ffffff, #f1f8e9);
        color: #042f2e;
        font-family: 'Segoe UI', sans-serif;
    }
    .title {
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        color: #0d47a1;
        text-shadow: 0px 0px 12px rgba(13,71,161,0.3);
        margin-bottom: 20px;
    }
    .card {
        background: linear-gradient(135deg, #ffffff, #e3f2fd);
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        margin: 10px 0;
    }
    .metric-card {
        background: linear-gradient(135deg, #0d47a1, #1976d2);
        border-radius: 12px;
        color: white;
        padding: 15px;
        text-align: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown('<div class="title">⚡ AI-Powered Resume Analyzer & Job Matcher ⚡</div>', unsafe_allow_html=True)

# ---- Upload Section ----
col1, col2 = st.columns([1, 2])
with col1:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    resume_file = st.file_uploader(
        '📄 Upload Resume (pdf/docx/png/jpg)',
        type=['pdf', 'docx', 'png', 'jpg', 'jpeg']
    )
    github_url = st.text_input('🔗 GitHub URL (optional)')
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    jd_text = st.text_area('📝 Paste Job Description here', height=320)
    st.markdown('</div>', unsafe_allow_html=True)

# ---- Processing Section ----
if resume_file and jd_text:
    t = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.name)[1])
    t.write(resume_file.getbuffer())
    t.flush()
    resume_text = parse_resume(t.name)

    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader('📑 Extracted Resume (preview)')
    st.text_area('Resume Text', resume_text[:5000], height=250)
    st.markdown('</div>', unsafe_allow_html=True)

    if st.button('🚀 Analyze & Build Report'):
        with st.spinner('Running AI analysis... please wait ⏳'):
            time.sleep(1.2)
            report = build_report(resume_text, jd_text, github_url or None)

        st.success('✅ Analysis complete')

        # ---- Futuristic Metrics ----
        st.markdown('<div class="metric-card">📊 Coverage Score</div>', unsafe_allow_html=True)
        st.metric('Coverage', f"{report['coverage_score']*100:.1f}%")

        score, tips = compute_hireability_score(report)
        st.markdown('<div class="metric-card">🤖 Hireability Score</div>', unsafe_allow_html=True)
        st.metric('Hireability', f"{score}/100")

        # ---- Skills Section ----
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('**✅ Detected Skills**')
        st.write(', '.join(report['skills_found']))
        st.markdown('**⚠️ Missing Skills**')
        st.write(', '.join(report['missing_skills']) or 'None')
        st.markdown('</div>', unsafe_allow_html=True)

        # ---- Matches ----
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader('🔍 Semantic Matches & Explanations')
        for m in report['matches'][:6]:
            st.markdown(f"**JD:** {m['jd_sentence']}")
            if 'explanation' in m:
                st.info('💡 ' + m['explanation'])
            for t in m.get('top_matches', []):
                st.write(f"- {t['resume_sentence']} (score: {t['score']:.3f})")
        st.markdown('</div>', unsafe_allow_html=True)

        # ---- Plan ----
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader('🗓️ 30/60/90 Day Plan')
        st.json(report['30_60_90_plan'])
        st.markdown('</div>', unsafe_allow_html=True)

        # ---- Interview Questions ----
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader('🎯 Interview Questions')
        for q in report['interview_questions']:
            st.write('- ' + q)
        st.markdown('</div>', unsafe_allow_html=True)

        # ---- Tips ----
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader('💡 Tips to Improve Hireability')
        for t in tips:
            st.write('- ' + t)
        st.markdown('</div>', unsafe_allow_html=True)

        # ---- Download ----
        st.download_button(
            '⬇️ Download report (JSON)',
            data=json.dumps(report, indent=2),
            file_name='report.json'
        )

    # ---- Bullet Rewriter ----
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader('✍️ Rewrite Experience Bullets (Impact-first)')
    bullets = st.text_area('Bullets (one per line)')
    if st.button('✨ Rewrite Bullets'):
        rewritten = rewrite_bullets_using_llm(bullets.splitlines())
        st.markdown('**Rewritten Bullets**')
        st.write(rewritten)
    st.markdown('</div>', unsafe_allow_html=True)

    # ---- PR Pack ----
    if st.button('📂 Generate PR Pack'):
        report = build_report(resume_text, jd_text, github_url or None)
        snapshot = generate_pr_snapshot(resume_text, report)
        st.json(snapshot)
