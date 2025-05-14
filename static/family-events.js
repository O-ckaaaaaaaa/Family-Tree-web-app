document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const eventsContainer = document.getElementById('events-container');
    const addEventBtn = document.getElementById('add-event');
    const eventModal = document.getElementById('event-form-modal');
    const eventForm = document.getElementById('event-form');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const mediaUpload = document.getElementById('media-upload');
    const uploadMediaBtn = document.getElementById('upload-media-btn');
    const mediaPreview = document.getElementById('media-preview');
    const videoPreview = document.getElementById('video-preview');
    const familyMembersList = document.getElementById('family-members-list');

    // App State
    let familyMembers = [];
    let events = [];
    let currentMedia = null;

    // Initialize
    loadFamilyMembers();
    loadEvents();

    // Event Listeners
    addEventBtn.addEventListener('click', openEventModal);
    cancelEventBtn.addEventListener('click', closeEventModal);
    eventForm.addEventListener('submit', handleEventSubmit);
    uploadMediaBtn.addEventListener('click', () => mediaUpload.click());
    mediaUpload.addEventListener('change', handleMediaUpload);

    // Functions
    function loadFamilyMembers() {
        // Load from localStorage or API
        const familyData = localStorage.getItem('familyTreeData');
        if (familyData) {
            try {
                const parsed = JSON.parse(familyData);
                familyMembers = parsed.people || [];
                renderFamilyMembersList();
            } catch (e) {
                console.error('Error loading family members:', e);
            }
        }
    }

    function loadEvents() {
        const eventsData = localStorage.getItem('familyEvents');
        if (eventsData) {
            try {
                events = JSON.parse(eventsData) || [];
                renderEvents();
            } catch (e) {
                console.error('Error loading events:', e);
            }
        }
    }

    function saveEvents() {
        localStorage.setItem('familyEvents', JSON.stringify(events));
    }

    function openEventModal() {
        eventModal.style.display = 'flex';
        document.getElementById('event-title').focus();
    }

    function closeEventModal() {
        eventModal.style.display = 'none';
        eventForm.reset();
        mediaPreview.style.display = 'none';
        videoPreview.style.display = 'none';
        currentMedia = null;
    }

    function renderFamilyMembersList() {
        familyMembersList.innerHTML = '';
        familyMembers.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-select';
            memberDiv.innerHTML = `
                <input type="checkbox" id="member-${member.id}" value="${member.id}">
                <label for="member-${member.id}">${member.name}</label>
            `;
            familyMembersList.appendChild(memberDiv);
        });
    }

    function handleMediaUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size should be less than 10MB');
            return;
        }

        currentMedia = {
            file,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: URL.createObjectURL(file)
        };

        if (currentMedia.type === 'image') {
            mediaPreview.src = currentMedia.url;
            mediaPreview.style.display = 'block';
            videoPreview.style.display = 'none';
        } else {
            videoPreview.src = currentMedia.url;
            videoPreview.style.display = 'block';
            mediaPreview.style.display = 'none';
        }
    }

    function handleEventSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value;
        const description = document.getElementById('event-description').value.trim();

        if (!title || !date) {
            alert('Please fill in required fields');
            return;
        }

        // Get selected members
        const selectedMembers = [];
        document.querySelectorAll('#family-members-list input[type="checkbox"]:checked').forEach(checkbox => {
            selectedMembers.push(checkbox.value);
        });

        // Create new event
        const newEvent = {
            id: Date.now().toString(),
            title,
            date,
            description,
            members: selectedMembers,
            media: null,
            createdAt: new Date().toISOString()
        };

        // Handle media if uploaded
        if (currentMedia) {
            // In a real app, you would upload to a server
            // For this demo, we'll store as data URL (not recommended for production)
            const reader = new FileReader();
            reader.onload = function(event) {
                newEvent.media = {
                    type: currentMedia.type,
                    data: event.target.result,
                    name: currentMedia.file.name
                };
                addEventToStorage(newEvent);
            };
            reader.readAsDataURL(currentMedia.file);
        } else {
            addEventToStorage(newEvent);
        }
    }

    function addEventToStorage(event) {
        events.unshift(event); // Add to beginning of array
        saveEvents();
        renderEvents();
        closeEventModal();
    }

    function renderEvents() {
        eventsContainer.innerHTML = '';

        if (events.length === 0) {
            eventsContainer.innerHTML = `
                <div style="text-align:center;grid-column:1/-1;padding:40px;color:#7f8c8d;">
                    <i class="fas fa-calendar-alt" style="font-size:50px;margin-bottom:20px;"></i>
                    <p>No events yet. Add your first family event!</p>
                </div>
            `;
            return;
        }

        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';

            let mediaHTML = '';
            if (event.media) {
                if (event.media.type === 'image') {
                    mediaHTML = `<img src="${event.media.data}" class="event-media" alt="${event.title}">`;
                } else {
                    mediaHTML = `
                        <video class="event-media" controls>
                            <source src="${event.media.data}" type="${event.media.type === 'video' ? 'video/mp4' : ''}">
                            Your browser does not support the video tag.
                        </video>
                    `;
                }
            } else {
                mediaHTML = `
                    <div class="event-media" style="background:#ecf0f1;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-calendar-alt" style="font-size:50px;color:#bdc3c7;"></i>
                    </div>
                `;
            }

            const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const membersHTML = event.members.map(memberId => {
                const member = familyMembers.find(m => m.id === memberId);
                return member ? `<span class="member-tag">${member.name}</span>` : '';
            }).join('');

            eventCard.innerHTML = `
                ${mediaHTML}
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date"><i class="fas fa-calendar-day"></i> ${formattedDate}</div>
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    ${event.members.length > 0 ? `
                        <div class="event-members">
                            <strong>Attendees:</strong> ${membersHTML}
                        </div>
                    ` : ''}
                </div>
            `;

            eventsContainer.appendChild(eventCard);
        });
    }
});