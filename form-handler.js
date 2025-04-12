// Simple form handler for contact form
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // In a real implementation, you would send this data to a server
            // For now, we'll just show a success message and clear the form
            
            // Store form data in localStorage (for demonstration purposes)
            const formData = {
                name: name,
                email: email,
                message: message,
                date: new Date().toLocaleString()
            };
            
            // Store the submission (in a real app, you'd send this to a server)
            let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
            submissions.push(formData);
            localStorage.setItem('formSubmissions', JSON.stringify(submissions));
            
            // Redirect to thank you page
            window.location.href = 'thank-you.html';
        });
    }
});
