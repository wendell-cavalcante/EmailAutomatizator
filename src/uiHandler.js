const uiHandler = {
    selectedGroup: null,

    selectGroup(groupName, buttonElement) {
        this.selectedGroup = groupName;
        document.querySelectorAll('.GroupButton').forEach(btn => btn.classList.remove('active'));
        buttonElement.classList.add('active');
        this.updatePreview();
    },

    updatePreview() {
        const notes = document.getElementById('notes').value;
        const sender = document.getElementById('att').value || 'Wendell';
        const greeting = new Date().getHours() < 12 ? 'Good morning!' : 'Good afternoon!';
        
        document.getElementById('preview').textContent = `${greeting}\n\n${notes}\n\nBest regards: ${sender}`;
    },

    onAuthSuccess() {
        const btn = document.getElementById('auth-btn');
        btn.textContent = 'Account Connected';
        btn.style.background = '#0ff';
        btn.disabled = true;
    }
};