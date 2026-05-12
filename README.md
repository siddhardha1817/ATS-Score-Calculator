# AI-Powered ATS Resume Analyzer

A comprehensive web application that analyzes resumes against job descriptions using AI and machine learning techniques. Get instant feedback on your resume's ATS compatibility and actionable suggestions to improve your chances of landing interviews.

## Features

- **AI-Powered Analysis**: Uses TF-IDF and cosine similarity for accurate scoring
- **PDF Resume Upload**: Support for PDF resume files with text extraction
- **ATS Score Calculation**: Get scored against job requirements (0-100%)
- **Keyword Matching**: Identify matching and missing keywords
- **Section Analysis**: Detailed breakdown of resume sections
- **Strengths & Weaknesses**: Comprehensive analysis of resume quality
- **Smart Suggestions**: Actionable recommendations to improve your resume
- **Modern UI**: Responsive design with beautiful dashboard cards
- **Progress Tracking**: Visual progress bars and animations
- **Report Download**: Generate and download analysis reports

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Machine Learning**: scikit-learn (TF-IDF, Cosine Similarity)
- **Text Processing**: NLTK, PyPDF2
- **UI Components**: Font Awesome icons

## Project Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Custom CSS styles
│   └── js/
│       └── script.js     # JavaScript functionality
├── uploads/              # Temporary file uploads
└── README.md            # This file
```

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Setup Instructions

1. **Clone or download the project files**

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your web browser** and navigate to:
   ```
   http://127.0.0.1:5000
   ```

## Usage

### Basic Usage

1. **Upload Resume**: Click "Choose File" and select your PDF resume
2. **Paste Job Description**: Copy and paste the full job description
3. **Click "Analyze Resume"**: Wait for the AI analysis to complete
4. **Review Results**: View your ATS score and detailed analysis
5. **Download Report**: Get a printable report of your analysis

### Understanding the Results

- **ATS Score**: Overall compatibility (0-100%)
  - 70-100%: Excellent match
  - 40-69%: Good match with room for improvement
  - 0-39%: Needs significant improvement

- **Matching Keywords**: Terms found in both resume and job description
- **Missing Keywords**: Important terms from job description not in resume
- **Section Analysis**: Evaluation of resume sections (Contact, Education, Experience, Skills, Summary)
- **Strengths**: What your resume does well
- **Weaknesses**: Areas that need improvement
- **Suggestions**: Specific recommendations to enhance your resume

## Advanced Features

### Section Analysis Details

The application analyzes these resume sections:

- **Contact Info**: Email, phone, LinkedIn presence
- **Education**: Academic qualifications and degrees
- **Experience**: Work history and years of experience
- **Skills**: Technical skills and competencies
- **Summary**: Professional summary or objective

### Keyword Analysis

- Uses TF-IDF (Term Frequency-Inverse Document Frequency)
- Calculates cosine similarity between resume and job description
- Identifies top keywords from both documents
- Provides matching and missing keyword lists

### Smart Suggestions

The AI generates personalized suggestions based on:
- ATS score performance
- Missing sections
- Keyword gaps
- Contact information completeness
- Experience level

## API Endpoints

### POST /analyze

Analyzes a resume against a job description.

**Request:**
- `resume`: PDF file (multipart/form-data)
- `job_description`: Job description text

**Response:**
```json
{
  "ats_score": 75.5,
  "matching_keywords": ["python", "machine learning", "data analysis"],
  "missing_keywords": ["deep learning", "tensorflow"],
  "resume_keywords": [["python", 5], ["data", 3]],
  "job_keywords": [["machine", 4], ["learning", 3]],
  "sections": {
    "contact_info": {"score": 100, "has_email": true, "has_phone": true, "has_linkedin": true},
    "education": {"present": true, "score": 100},
    "experience": {"present": true, "years_of_experience": 3, "score": 30},
    "skills": {"present": true, "score": 100},
    "summary": {"present": false, "score": 0}
  },
  "strengths": ["Strong keyword alignment", "Well-structured skills section"],
  "weaknesses": ["Missing professional summary"],
  "suggestions": ["Add a professional summary at the beginning"]
}
```

## Troubleshooting

### Common Issues

1. **PDF Text Extraction Error**
   - Ensure PDF contains readable text (not scanned images)
   - Try saving the PDF with embedded text
   - Check file size (max 16MB)

2. **Low ATS Score**
   - Add more keywords from the job description
   - Ensure important sections are present
   - Use industry-standard terminology

3. **Application Won't Start**
   - Check Python version (3.7+)
   - Install all dependencies from requirements.txt
   - Ensure virtual environment is activated

4. **NLTK Data Download Error**
   - The application automatically downloads required NLTK data
   - Ensure internet connection for first run
   - Check firewall/proxy settings if needed

### Performance Tips

- Use clear, well-structured PDFs
- Include relevant keywords naturally
- Maintain standard resume sections
- Keep file size under 16MB

## Development

### Adding New Features

1. **New Analysis Metrics**: Add methods to the `ATSAnalyzer` class
2. **UI Components**: Modify templates and CSS files
3. **API Endpoints**: Add new routes in `app.py`

### Customization

- Modify scoring algorithms in `ATSAnalyzer` class
- Update UI themes in `style.css`
- Add new analysis sections in the template

## Security Considerations

- Uploaded files are automatically deleted after analysis
- No personal data is stored permanently
- File size limited to 16MB
- Only PDF files are accepted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the error messages in the console
- Ensure all dependencies are properly installed

## Future Enhancements

- Multiple resume comparison
- Industry-specific analysis
- Resume template recommendations
- Integration with job boards
- Real-time analysis as you type
- Export to multiple formats (PDF, Word)

---

**Note**: This application is designed to provide guidance on resume optimization. The ATS scores are estimates and actual ATS systems may use different algorithms. Use the suggestions as recommendations rather than absolute requirements.
