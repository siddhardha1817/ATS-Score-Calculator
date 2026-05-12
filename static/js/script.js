// Global variables
let analysisResults = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form submission
    const analysisForm = document.getElementById('analysisForm');
    if (analysisForm) {
        analysisForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize file upload validation
    initializeFileUpload();
    
    // Initialize character counter for job description
    initializeCharacterCounter();
});

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const resumeFile = formData.get('resume');
    const jobDescription = formData.get('job_description');
    
    // Validation
    if (!resumeFile || resumeFile.size === 0) {
        showNotification('Please select a resume file', 'error');
        return;
    }
    
    if (!jobDescription || jobDescription.trim().length < 50) {
        showNotification('Please provide a detailed job description (at least 50 characters)', 'error');
        return;
    }
    
    if (resumeFile.type !== 'application/pdf') {
        showNotification('Please upload a PDF file', 'error');
        return;
    }
    
    // Show loading overlay
    showLoading();
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            analysisResults = data;
            displayResults(data);
            showNotification('Analysis completed successfully!', 'success');
        } else {
            showNotification(data.error || 'Analysis failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Display analysis results
function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!resultsContainer) return;
    
    // Create results HTML
    const resultsHTML = `
        <div class="results-section fade-in-up">
            <!-- ATS Score Card -->
            <div class="dashboard-card text-center">
                <div class="card-icon ${getScoreClass(data.ats_score)}">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="card-value ${getScoreClass(data.ats_score)}">${data.ats_score}%</div>
                <div class="card-label">ATS Score</div>
                <div class="progress mt-3">
                    <div class="progress-bar ${getProgressBarClass(data.ats_score)}" 
                         role="progressbar" 
                         style="width: 0%" 
                         data-width="${data.ats_score}%">
                    </div>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="row mt-4">
                <div class="col-md-3 col-6 mb-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="card-value">${data.matching_keywords.length}</div>
                        <div class="card-label">Matching Keywords</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-danger">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="card-value">${data.missing_keywords.length}</div>
                        <div class="card-label">Missing Keywords</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-info">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="card-value">${data.strengths.length}</div>
                        <div class="card-label">Strengths</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="dashboard-card text-center">
                        <div class="card-icon text-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="card-value">${data.weaknesses.length}</div>
                        <div class="card-label">Weaknesses</div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="text-center mt-4">
                <button class="btn btn-primary me-2" onclick="showDetailedResults()">
                    <i class="fas fa-chart-line me-2"></i>View Detailed Analysis
                </button>
                <button class="btn btn-success" onclick="downloadReport()">
                    <i class="fas fa-download me-2"></i>Download Report
                </button>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Animate progress bar
    setTimeout(() => {
        const progressBar = resultsContainer.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = progressBar.getAttribute('data-width');
        }
    }, 100);
}

// Show detailed results in modal
function showDetailedResults() {
    if (!analysisResults) return;
    
    const modalResults = document.getElementById('modalResults');
    if (!modalResults) return;
    
    const data = analysisResults;
    
    const modalHTML = `
        <!-- ATS Score Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="dashboard-card text-center">
                    <h4>Overall ATS Score</h4>
                    <div class="score-display ${getScoreClass(data.ats_score)}">${data.ats_score}%</div>
                    <div class="progress">
                        <div class="progress-bar ${getProgressBarClass(data.ats_score)}" 
                             role="progressbar" 
                             style="width: ${data.ats_score}%">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Keywords Section -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-check-circle text-success me-2"></i>Matching Keywords</h5>
                    <div class="keywords-container">
                        ${data.matching_keywords.map(keyword => 
                            `<span class="keyword-badge keyword-matching">${keyword}</span>`
                        ).join('')}
                        ${data.matching_keywords.length === 0 ? '<p class="text-muted">No matching keywords found</p>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-times-circle text-danger me-2"></i>Missing Keywords</h5>
                    <div class="keywords-container">
                        ${data.missing_keywords.map(keyword => 
                            `<span class="keyword-badge keyword-missing">${keyword}</span>`
                        ).join('')}
                        ${data.missing_keywords.length === 0 ? '<p class="text-muted">All keywords matched!</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Resume vs Job Keywords -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-file-alt text-info me-2"></i>Top Resume Keywords</h5>
                    <div class="keywords-container">
                        ${data.resume_keywords.map(keyword => 
                            `<span class="keyword-badge keyword-resume">${keyword[0]} (${keyword[1]})</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-briefcase text-warning me-2"></i>Top Job Keywords</h5>
                    <div class="keywords-container">
                        ${data.job_keywords.map(keyword => 
                            `<span class="keyword-badge keyword-job">${keyword[0]} (${keyword[1]})</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Section Analysis -->
        <div class="row mb-4">
            <div class="col-12">
                <h5 class="mb-3"><i class="fas fa-chart-pie me-2"></i>Resume Section Analysis</h5>
                <div class="row">
                    ${Object.entries(data.sections).map(([sectionName, sectionData]) => `
                        <div class="col-md-6 mb-3">
                            <div class="section-card">
                                <h6 class="section-title">${formatSectionName(sectionName)}</h6>
                                <div class="progress mb-2">
                                    <div class="progress-bar ${getProgressBarClass(sectionData.score)}" 
                                         role="progressbar" 
                                         style="width: ${sectionData.score}%">
                                        ${sectionData.score}%
                                    </div>
                                </div>
                                ${getSectionDetails(sectionName, sectionData)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Strengths and Weaknesses -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-trophy text-success me-2"></i>Strengths</h5>
                    ${data.strengths.map(strength => 
                        `<div class="strength-item"><i class="fas fa-check me-2"></i>${strength}</div>`
                    ).join('')}
                    ${data.strengths.length === 0 ? '<p class="text-muted">No specific strengths identified</p>' : ''}
                </div>
            </div>
            <div class="col-md-6">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-exclamation-triangle text-danger me-2"></i>Weaknesses</h5>
                    ${data.weaknesses.map(weakness => 
                        `<div class="weakness-item"><i class="fas fa-times me-2"></i>${weakness}</div>`
                    ).join('')}
                    ${data.weaknesses.length === 0 ? '<p class="text-muted">No major weaknesses found!</p>' : ''}
                </div>
            </div>
        </div>
        
        <!-- Suggestions -->
        <div class="row">
            <div class="col-12">
                <div class="section-card">
                    <h5 class="section-title"><i class="fas fa-lightbulb text-info me-2"></i>Improvement Suggestions</h5>
                    ${data.suggestions.map(suggestion => 
                        `<div class="suggestion-item"><i class="fas fa-arrow-right me-2"></i>${suggestion}</div>`
                    ).join('')}
                    ${data.suggestions.length === 0 ? '<p class="text-muted">No suggestions needed - your resume looks great!</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    modalResults.innerHTML = modalHTML;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
    modal.show();
}

// Helper functions
function getScoreClass(score) {
    if (score >= 70) return 'score-excellent';
    if (score >= 40) return 'score-good';
    return 'score-poor';
}

function getProgressBarClass(score) {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger';
}

function formatSectionName(sectionName) {
    return sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getSectionDetails(sectionName, sectionData) {
    const details = [];
    
    if (sectionName === 'contact_info') {
        if (sectionData.has_email) details.push('<i class="fas fa-check text-success me-1"></i>Email');
        if (sectionData.has_phone) details.push('<i class="fas fa-check text-success me-1"></i>Phone');
        if (sectionData.has_linkedin) details.push('<i class="fas fa-check text-success me-1"></i>LinkedIn');
    } else if (sectionName === 'experience') {
        details.push(`<i class="fas fa-briefcase me-1"></i>${sectionData.years_of_experience} years experience`);
    } else if (sectionData.present) {
        details.push('<i class="fas fa-check text-success me-1"></i>Section present');
    } else {
        details.push('<i class="fas fa-times text-danger me-1"></i>Section missing');
    }
    
    return `<div class="small text-muted">${details.join(' | ')}</div>`;
}

// Download report
function downloadReport() {
    if (!analysisResults) return;
    
    const data = analysisResults;
    const reportContent = generateReportContent(data);
    
    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'ats-analysis-report.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Report downloaded successfully!', 'success');
}

// Generate report content
function generateReportContent(data) {
    let content = 'ATS RESUME ANALYSIS REPORT\n';
    content += '=' .repeat(50) + '\n\n';
    
    content += `OVERALL ATS SCORE: ${data.ats_score}%\n`;
    content += `Analysis Date: ${new Date().toLocaleString()}\n\n`;
    
    content += 'KEYWORD ANALYSIS\n';
    content += '-'.repeat(20) + '\n';
    content += `Matching Keywords (${data.matching_keywords.length}):\n`;
    content += data.matching_keywords.join(', ') + '\n\n';
    content += `Missing Keywords (${data.missing_keywords.length}):\n`;
    content += data.missing_keywords.join(', ') + '\n\n';
    
    content += 'SECTION ANALYSIS\n';
    content += '-'.repeat(20) + '\n';
    Object.entries(data.sections).forEach(([section, sectionData]) => {
        content += `${formatSectionName(section)}: ${sectionData.score}%\n`;
    });
    content += '\n';
    
    content += 'STRENGTHS\n';
    content += '-'.repeat(20) + '\n';
    data.strengths.forEach(strength => {
        content += `• ${strength}\n`;
    });
    content += '\n';
    
    content += 'WEAKNESSES\n';
    content += '-'.repeat(20) + '\n';
    data.weaknesses.forEach(weakness => {
        content += `• ${weakness}\n`;
    });
    content += '\n';
    
    content += 'SUGGESTIONS\n';
    content += '-'.repeat(20) + '\n';
    data.suggestions.forEach(suggestion => {
        content += `• ${suggestion}\n`;
    });
    
    return content;
}

// Loading overlay functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize file upload validation
function initializeFileUpload() {
    const fileInput = document.getElementById('resume');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 16 * 1024 * 1024) { // 16MB limit
                    showNotification('File size must be less than 16MB', 'error');
                    e.target.value = '';
                } else if (file.type !== 'application/pdf') {
                    showNotification('Please upload a PDF file', 'error');
                    e.target.value = '';
                }
            }
        });
    }
}

// Initialize character counter
function initializeCharacterCounter() {
    const jobDescription = document.getElementById('jobDescription');
    if (jobDescription) {
        jobDescription.addEventListener('input', function() {
            const length = this.value.length;
            const minLength = 50;
            
            if (length < minLength) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }
}

// Utility functions
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

// Network status
window.addEventListener('online', function() {
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showNotification('Connection lost. Please check your internet connection.', 'error');
});
