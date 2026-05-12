from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import re
import math
from collections import Counter
from werkzeug.utils import secure_filename
import PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
# Basic text processing without NLTK dependency
import string

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class ATSAnalyzer:
    def __init__(self):
        # Basic English stopwords
        self.stop_words = {
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
            'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
            'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
            'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
            'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
            'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after',
            'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
            'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
            'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
            'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
            'just', 'don', 'should', 'now'
        }
        
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF file"""
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""
        return text
    
    def preprocess_text(self, text):
        """Preprocess text for analysis"""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Tokenize
        tokens = word_tokenize(text)
        # Remove stopwords
        tokens = [token for token in tokens if token not in self.stop_words]
        return ' '.join(tokens)
    
    def calculate_ats_score(self, resume_text, job_description):
        """Calculate ATS score using TF-IDF and cosine similarity"""
        # Preprocess texts
        resume_processed = self.preprocess_text(resume_text)
        job_processed = self.preprocess_text(job_description)
        
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer()
        try:
            tfidf_matrix = vectorizer.fit_transform([resume_processed, job_processed])
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            # Convert to percentage (0-100)
            ats_score = similarity * 100
            return round(ats_score, 2)
        except:
            return 0.0
    
    def extract_keywords(self, text, top_n=20):
        """Extract top keywords from text"""
        processed_text = self.preprocess_text(text)
        words = processed_text.split()
        word_freq = Counter(words)
        return word_freq.most_common(top_n)
    
    def find_matching_keywords(self, resume_text, job_description):
        """Find keywords that match between resume and job description"""
        resume_keywords = set([word[0] for word in self.extract_keywords(resume_text, 50)])
        job_keywords = set([word[0] for word in self.extract_keywords(job_description, 50)])
        
        matching = resume_keywords.intersection(job_keywords)
        missing_from_resume = job_keywords - resume_keywords
        
        return list(matching), list(missing_from_resume)
    
    def analyze_resume_sections(self, resume_text):
        """Analyze different sections of the resume"""
        sections = {
            'contact_info': self.analyze_contact_info(resume_text),
            'education': self.analyze_education(resume_text),
            'experience': self.analyze_experience(resume_text),
            'skills': self.analyze_skills(resume_text),
            'summary': self.analyze_summary(resume_text)
        }
        return sections
    
    def analyze_contact_info(self, text):
        """Analyze contact information"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        linkedin_pattern = r'linkedin\.com/in/[a-zA-Z0-9-]+'
        
        has_email = bool(re.search(email_pattern, text, re.IGNORECASE))
        has_phone = bool(re.search(phone_pattern, text))
        has_linkedin = bool(re.search(linkedin_pattern, text, re.IGNORECASE))
        
        score = sum([has_email, has_phone, has_linkedin]) / 3 * 100
        
        return {
            'score': score,
            'has_email': has_email,
            'has_phone': has_phone,
            'has_linkedin': has_linkedin
        }
    
    def analyze_education(self, text):
        """Analyze education section"""
        education_keywords = ['education', 'university', 'college', 'degree', 'bachelor', 'master', 'phd', 'diploma']
        education_found = any(keyword in text.lower() for keyword in education_keywords)
        
        return {
            'present': education_found,
            'score': 100 if education_found else 0
        }
    
    def analyze_experience(self, text):
        """Analyze work experience section"""
        experience_keywords = ['experience', 'work', 'job', 'employment', 'career', 'professional']
        experience_found = any(keyword in text.lower() for keyword in experience_keywords)
        
        # Count years of experience
        year_pattern = r'(\d+)\s*(?:years?|yrs?)'
        years = re.findall(year_pattern, text.lower())
        total_years = sum(int(year) for year in years) if years else 0
        
        return {
            'present': experience_found,
            'years_of_experience': total_years,
            'score': min(100, total_years * 10) if total_years > 0 else 0
        }
    
    def analyze_skills(self, text):
        """Analyze skills section"""
        skills_keywords = ['skills', 'technical', 'programming', 'languages', 'tools', 'technologies']
        skills_found = any(keyword in text.lower() for keyword in skills_keywords)
        
        return {
            'present': skills_found,
            'score': 100 if skills_found else 0
        }
    
    def analyze_summary(self, text):
        """Analyze summary/objective section"""
        summary_keywords = ['summary', 'objective', 'profile', 'about', 'overview']
        summary_found = any(keyword in text.lower() for keyword in summary_keywords)
        
        return {
            'present': summary_found,
            'score': 100 if summary_found else 0
        }
    
    def generate_strengths_weaknesses(self, resume_text, job_description, ats_score):
        """Generate strengths and weaknesses analysis"""
        matching_keywords, missing_keywords = self.find_matching_keywords(resume_text, job_description)
        sections = self.analyze_resume_sections(resume_text)
        
        strengths = []
        weaknesses = []
        
        # ATS Score based analysis
        if ats_score >= 70:
            strengths.append("Strong keyword alignment with job description")
        elif ats_score < 40:
            weaknesses.append("Low keyword match with job requirements")
        
        # Section analysis
        for section_name, section_data in sections.items():
            if section_data.get('score', 0) >= 80:
                strengths.append(f"Well-structured {section_name.replace('_', ' ')} section")
            elif section_data.get('score', 0) < 50:
                weaknesses.append(f"Missing or weak {section_name.replace('_', ' ')} section")
        
        # Keyword analysis
        if len(matching_keywords) > 10:
            strengths.append("Good variety of relevant keywords")
        if len(missing_keywords) > 10:
            weaknesses.append("Missing important keywords from job description")
        
        return strengths, weaknesses
    
    def generate_suggestions(self, resume_text, job_description, ats_score, sections):
        """Generate improvement suggestions"""
        suggestions = []
        
        # ATS Score suggestions
        if ats_score < 50:
            suggestions.append("Add more keywords from the job description to improve ATS score")
        
        # Section-specific suggestions
        if not sections['contact_info']['has_email']:
            suggestions.append("Add your email address to the contact information")
        if not sections['contact_info']['has_phone']:
            suggestions.append("Include your phone number for better contactability")
        if not sections['contact_info']['has_linkedin']:
            suggestions.append("Add your LinkedIn profile URL to enhance professional presence")
        
        if not sections['education']['present']:
            suggestions.append("Include an education section with your degrees and certifications")
        
        if not sections['experience']['present']:
            suggestions.append("Add a work experience section to showcase your professional background")
        elif sections['experience']['years_of_experience'] < 2:
            suggestions.append("Provide more detailed work experience with specific achievements")
        
        if not sections['skills']['present']:
            suggestions.append("Create a dedicated skills section highlighting your technical abilities")
        
        if not sections['summary']['present']:
            suggestions.append("Add a professional summary at the beginning of your resume")
        
        return suggestions

# Initialize analyzer
analyzer = ATSAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file uploaded'}), 400
    
    file = request.files['resume']
    job_description = request.form.get('job_description', '')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extract text from resume
        resume_text = analyzer.extract_text_from_pdf(filepath)
        
        if not resume_text.strip():
            return jsonify({'error': 'Could not extract text from PDF. Please ensure the PDF contains readable text.'}), 400
        
        # Perform analysis
        ats_score = analyzer.calculate_ats_score(resume_text, job_description)
        matching_keywords, missing_keywords = analyzer.find_matching_keywords(resume_text, job_description)
        resume_keywords = analyzer.extract_keywords(resume_text, 15)
        job_keywords = analyzer.extract_keywords(job_description, 15)
        sections = analyzer.analyze_resume_sections(resume_text)
        strengths, weaknesses = analyzer.generate_strengths_weaknesses(resume_text, job_description, ats_score)
        suggestions = analyzer.generate_suggestions(resume_text, job_description, ats_score, sections)
        
        # Clean up uploaded file
        os.remove(filepath)
        
        result = {
            'ats_score': ats_score,
            'matching_keywords': matching_keywords,
            'missing_keywords': missing_keywords,
            'resume_keywords': resume_keywords,
            'job_keywords': job_keywords,
            'sections': sections,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'suggestions': suggestions
        }
        
        return jsonify(result)
    
    return jsonify({'error': 'Invalid file type. Please upload a PDF file.'}), 400

if __name__ == '__main__':
    app.run(debug=True)
