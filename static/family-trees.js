document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const treeContainer = document.getElementById('tree-container');
    const addRootBtn = document.getElementById('add-root');
    const addChildBtn = document.getElementById('add-child');
    const addSpouseBtn = document.getElementById('add-spouse');
    const editBtn = document.getElementById('edit-person');
    const deleteBtn = document.getElementById('delete-person');
    const saveBtn = document.getElementById('save-tree');
    const loadBtn = document.getElementById('load-tree');
    const resetBtn = document.getElementById('reset-tree');
    const modal = document.getElementById('person-modal');
    const modalTitle = document.getElementById('modal-title');
    const personForm = document.getElementById('person-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const parentSelect = document.getElementById('parent-id');
    const spouseSelect = document.getElementById('spouse-id');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const uploadBtn = document.getElementById('upload-btn');
    const genderOptions = document.querySelectorAll('.gender-option');
    const genderInput = document.getElementById('gender');

    // App State
    let people = [];
    let selectedPersonId = null;
    let nextId = 1;
    let modalMode = 'add'; // 'add', 'add-child', 'add-spouse', 'edit'

    // Initialize
    loadFamilyData();

    // Event Listeners
    addRootBtn.addEventListener('click', () => {
        modalMode = 'add';
        openModal('Add Root Person', null);
    });

    addChildBtn.addEventListener('click', () => {
        modalMode = 'add-child';
        openModal('Add Child', selectedPersonId);
    });

    addSpouseBtn.addEventListener('click', () => {
        modalMode = 'add-spouse';
        openModal('Add Spouse', selectedPersonId);
    });

    editBtn.addEventListener('click', () => {
        modalMode = 'edit';
        const person = people.find(p => p.id === selectedPersonId);
        if (person) openModal('Edit Person', person.parentId, person);
    });

    deleteBtn.addEventListener('click', deleteSelectedPerson);
    saveBtn.addEventListener('click', saveFamilyData);
    loadBtn.addEventListener('click', loadFamilyData);
    resetBtn.addEventListener('click', resetTree);
    cancelBtn.addEventListener('click', closeModal);
    personForm.addEventListener('submit', handleFormSubmit);
    uploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleImageUpload);

    // Gender selection
    genderOptions.forEach(option => {
        option.addEventListener('click', function() {
            genderOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            genderInput.value = this.dataset.value;
        });
    });

    // API Functions
    async function fetchFamilyData() {
        try {
            const response = await fetch('/api/family');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching family data:', error);
            throw error;
        }
    }

    async function saveFamilyDataToServer(data) {
        try {
            const response = await fetch('/api/family', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to save data');
            return await response.json();
        } catch (error) {
            console.error('Error saving family data:', error);
            throw error;
        }
    }

    async function addFamilyMember(member) {
        try {
            const response = await fetch('/api/family/member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(member)
            });
            if (!response.ok) throw new Error('Failed to add member');
            return await response.json();
        } catch (error) {
            console.error('Error adding family member:', error);
            throw error;
        }
    }

    async function updateFamilyMember(memberId, updates) {
        try {
            const response = await fetch(`/api/family/member/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update member');
            return await response.json();
        } catch (error) {
            console.error('Error updating family member:', error);
            throw error;
        }
    }

    async function deleteFamilyMember(memberId) {
        try {
            const response = await fetch(`/api/family/member/${memberId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete member');
            return await response.json();
        } catch (error) {
            console.error('Error deleting family member:', error);
            throw error;
        }
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload image');
            return await response.json();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // Application Functions
    async function loadFamilyData() {
        try {
            const data = await fetchFamilyData();
            people = data.people || [];
            nextId = data.nextId || 1;
            selectedPersonId = null;
            renderTree();
        } catch (error) {
            alert('Failed to load family data. Please try again.');
        }
    }

    async function saveFamilyData() {
        try {
            await saveFamilyDataToServer({
                people,
                nextId
            });
            alert('Family tree saved successfully!');
        } catch (error) {
            alert('Failed to save family data. Please try again.');
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('person-id').value;
        const name = document.getElementById('name').value.trim();
        const gender = document.getElementById('gender').value;
        const birthDate = document.getElementById('birth-date').value;
        const phone = document.getElementById('phone').value.trim();
        const parentId = modalMode === 'add-child' ? parentSelect.value :
                        (modalMode === 'add' ? parentSelect.value || null : null);
        const spouseId = modalMode === 'add-spouse' ? spouseSelect.value : null;
        const photo = imagePreview.src;

        if (!name) {
            alert('Please enter a name');
            return;
        }

        try {
            if (id) {
                // Update existing person
                const updates = {
                    name,
                    gender,
                    birthDate,
                    phone,
                    photo,
                    parentId: parentId || undefined,
                    spouseId: spouseId || undefined
                };

                await updateFamilyMember(id, updates);

                // Update local state
                const index = people.findIndex(p => p.id === id);
                if (index !== -1) {
                    people[index] = { ...people[index], ...updates };
                }
            } else {
                // Add new person
                const newPerson = {
                    name,
                    gender,
                    birthDate,
                    phone,
                    photo,
                    parentId: parentId || undefined,
                    spouseId: spouseId || undefined
                };

                const result = await addFamilyMember(newPerson);
                newPerson.id = result.id;
                people.push(newPerson);
                nextId = Math.max(nextId, parseInt(result.id) + 1);

                // Update spouse relationship if adding spouse
                if (spouseId && modalMode === 'add-spouse') {
                    const spouseIndex = people.findIndex(p => p.id === spouseId);
                    if (spouseIndex !== -1) {
                        people[spouseIndex].spouseId = newPerson.id;
                        await updateFamilyMember(spouseId, { spouseId: newPerson.id });
                    }
                }
            }

            closeModal();
            renderTree();
        } catch (error) {
            alert('Failed to save person. Please try again.');
        }
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            try {
                const result = await uploadImage(file);
                imagePreview.src = result.url;
            } catch (error) {
                alert('Failed to upload image. Please try again.');
            }
        }
    }

    async function deleteSelectedPerson() {
        if (!selectedPersonId) return;

        const person = people.find(p => p.id === selectedPersonId);
        if (!person) return;

        // Check if this person has a spouse
        const spouse = person.spouseId ? people.find(p => p.id === person.spouseId) : null;

        if (confirm(`Delete ${person.name}${spouse ? ` and their relationship with ${spouse.name}` : ''}?`)) {
            try {
                await deleteFamilyMember(selectedPersonId);

                // Remove from local state
                people = people.filter(p => p.id !== selectedPersonId);

                // Update spouse reference if exists
                if (person.spouseId) {
                    const spouseIndex = people.findIndex(p => p.id === person.spouseId);
                    if (spouseIndex !== -1) {
                        people[spouseIndex].spouseId = undefined;
                    }
                }

                selectedPersonId = null;
                renderTree();
            } catch (error) {
                alert('Failed to delete person. Please try again.');
            }
        }
    }

    async function resetTree() {
        if (confirm('Are you sure you want to clear the entire family tree? This cannot be undone.')) {
            try {
                // Clear server data
                await saveFamilyDataToServer({ people: [], nextId: 1 });

                // Clear local state
                people = [];
                nextId = 1;
                selectedPersonId = null;
                renderTree();
            } catch (error) {
                alert('Failed to reset tree. Please try again.');
            }
        }
    }

    // UI Functions
    function openModal(title, parentId, person = null) {
        modalTitle.textContent = title;
        document.getElementById('person-id').value = person ? person.id : '';
        document.getElementById('name').value = person ? person.name : '';
        document.getElementById('birth-date').value = person ? person.birthDate : '';
        document.getElementById('phone').value = person ? person.phone : '';
        imagePreview.src = person ? person.photo : 'https://www.gravatar.com/avatar/default?s=200&d=mp';

        // Set gender
        const gender = person ? person.gender : 'male';
        genderInput.value = gender;
        genderOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === gender);
        });

        // Setup parent/spouse selects based on modal mode
        parentSelect.innerHTML = '';
        spouseSelect.innerHTML = '';

        const parentGroup = document.getElementById('parent-select-group');
        const spouseGroup = document.getElementById('spouse-select-group');

        parentGroup.style.display = 'none';
        spouseGroup.style.display = 'none';

        switch(modalMode) {
            case 'add-child':
                parentGroup.style.display = 'block';
                const parent = people.find(p => p.id === parentId);
                if (parent) {
                    const option = document.createElement('option');
                    option.value = parent.id;
                    option.textContent = parent.name;
                    option.selected = true;
                    parentSelect.appendChild(option);
                }
                break;

            case 'add-spouse':
                spouseGroup.style.display = 'block';
                // Find potential spouses (not already married and opposite gender)
                const currentPerson = people.find(p => p.id === parentId);
                if (currentPerson) {
                    const potentialSpouses = people.filter(p =>
                        p.id !== currentPerson.id &&
                        !p.spouseId &&
                        (p.gender !== currentPerson.gender || p.gender === 'other' || currentPerson.gender === 'other')
                    );

                    if (potentialSpouses.length > 0) {
                        potentialSpouses.forEach(spouse => {
                            const option = document.createElement('option');
                            option.value = spouse.id;
                            option.textContent = spouse.name;
                            spouseSelect.appendChild(option);
                        });
                    } else {
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'No available spouses';
                        option.disabled = true;
                        spouseSelect.appendChild(option);
                    }
                }
                break;

            case 'add':
                parentGroup.style.display = 'block';
                // For root nodes, show all possible parents
                people.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.name;
                    parentSelect.appendChild(option);
                });
                break;
        }

        modal.style.display = 'flex';
        document.getElementById('name').focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        personForm.reset();
        imageUpload.value = '';
    }

    function renderTree() {
        // Clear existing tree
        treeContainer.innerHTML = '';

        // Remove any existing connectors
        document.querySelectorAll('.parent-connector, .marriage-connector, .marriage-heart, .connection-point').forEach(el => el.remove());

        if (people.length === 0) {
            treeContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-tree" style="font-size: 50px; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px;">No family members yet.</p>
                    <p>Click "Add Root Person" to start your family tree.</p>
                </div>
            `;
            return;
        }

        // Calculate hierarchical positions
        const positions = calculateTreePositions();

        // Create nodes
        people.forEach(person => {
            const pos = positions[person.id];
            if (!pos) return;

            const node = document.createElement('div');
            node.className = `node ${person.gender || 'other'} ${person.spouseId ? 'married' : ''}`;
            node.id = `node-${person.id}`;
            node.style.left = `${pos.x}px`;
            node.style.top = `${pos.y}px`;

            node.innerHTML = `
                <img src="${person.photo || 'https://www.gravatar.com/avatar/default?s=200&d=mp'}"
                     class="profile-pic"
                     alt="${person.name}"
                     onerror="this.src='https://www.gravatar.com/avatar/default?s=200&d=mp'">
                <div class="name">${person.name}</div>
                <div class="details">
                    ${person.birthDate ? `<div>${formatDate(person.birthDate)}</div>` : ''}
                    ${person.phone ? `<div><i class="fas fa-phone"></i> ${person.phone}</div>` : ''}
                </div>
            `;

            node.addEventListener('click', () => selectPerson(person.id));
            treeContainer.appendChild(node);

            // Draw parent-child connectors
            if (person.parentId) {
                const parentPos = positions[person.parentId];
                if (parentPos) {
                    drawParentChildConnector(parentPos, pos);
                }
            }

            // Draw marriage connectors (only draw once per pair)
            if (person.spouseId && person.id < person.spouseId) {
                const spousePos = positions[person.spouseId];
                if (spousePos) {
                    drawMarriageConnector(pos, spousePos);
                }
            }
        });

        // Update button states
        updateButtonStates();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function calculateTreePositions() {
        const positions = {};
        const levelMap = {};
        const margin = 40;
        const nodeWidth = 140;
        const nodeHeight = 160;
        const verticalSpacing = 180;
        const marriageSpacing = 30;

        // First pass: assign levels using BFS
        const queue = [];
        const roots = people.filter(p => !p.parentId);
        roots.forEach(root => {
            levelMap[root.id] = 0;
            queue.push(root);
        });

        while (queue.length > 0) {
            const current = queue.shift();
            const children = people.filter(p => p.parentId === current.id);

            children.forEach(child => {
                if (levelMap[child.id] === undefined) {
                    levelMap[child.id] = levelMap[current.id] + 1;
                    queue.push(child);
                }
            });
        }

        // Second pass: organize people by level
        const levels = {};
        people.forEach(person => {
            const level = levelMap[person.id] || 0;
            if (!levels[level]) levels[level] = [];
            levels[level].push(person);
        });

        // Position nodes level by level from top to bottom
        const levelWidths = {};
        Object.keys(levels).sort((a,b) => a - b).forEach(level => {
            const peopleInLevel = levels[level];

            // Group by families (parents or marriage)
            const familyGroups = {};
            peopleInLevel.forEach(person => {
                // Group children under their parent
                if (person.parentId) {
                    const familyKey = person.parentId;
                    if (!familyGroups[familyKey]) familyGroups[familyKey] = [];
                    familyGroups[familyKey].push(person);
                }
                // Group spouses together
                else if (person.spouseId) {
                    const spouse = people.find(p => p.id === person.spouseId);
                    if (spouse && levelMap[spouse.id] === levelMap[person.id]) {
                        const familyKey = person.id < person.spouseId ? person.id : person.spouseId;
                        if (!familyGroups[familyKey]) familyGroups[familyKey] = [];
                        if (!familyGroups[familyKey].includes(person)) familyGroups[familyKey].push(person);
                        if (!familyGroups[familyKey].includes(spouse)) familyGroups[familyKey].push(spouse);
                    }
                }
                // Standalone nodes
                else {
                    const familyKey = person.id;
                    if (!familyGroups[familyKey]) familyGroups[familyKey] = [];
                    familyGroups[familyKey].push(person);
                }
            });

            // Calculate positions for each family group
            let currentX = margin;
            Object.values(familyGroups).forEach(group => {
                // Position spouses horizontally first
                const spouses = group.filter(p => p.spouseId && group.some(sp => sp.id === p.spouseId));
                const nonSpouses = group.filter(p => !spouses.some(sp => sp.id === p.id));

                // Position spouses side by side
                spouses.forEach((person, index) => {
                    if (positions[person.id]) return; // Already positioned by spouse

                    const spouse = people.find(p => p.id === person.spouseId);
                    if (spouse && !positions[spouse.id]) {
                        positions[person.id] = {
                            x: currentX,
                            y: margin + (level * verticalSpacing)
                        };

                        positions[spouse.id] = {
                            x: currentX + nodeWidth + marriageSpacing,
                            y: margin + (level * verticalSpacing)
                        };

                        currentX += (nodeWidth * 2) + marriageSpacing + margin;
                    }
                });

                // Position non-spouses (children of the same parent)
                nonSpouses.forEach(person => {
                    positions[person.id] = {
                        x: currentX,
                        y: margin + (level * verticalSpacing)
                    };
                    currentX += nodeWidth + margin;
                });
            });

            // Track the width of this level for centering
            levelWidths[level] = currentX;
        });

        // Center each level horizontally
        const maxWidth = Math.max(...Object.values(levelWidths));
        Object.keys(levels).forEach(level => {
            const levelWidth = levelWidths[level] || maxWidth;
            const offset = (treeContainer.offsetWidth - levelWidth) / 2;

            levels[level].forEach(person => {
                if (positions[person.id]) {
                    positions[person.id].x += offset;
                }
            });
        });

        return positions;
    }

    function drawParentChildConnector(parentPos, childPos) {
        const parentCenterX = parentPos.x + 70;
        const parentBottom = parentPos.y + 160;
        const childCenterX = childPos.x + 70;
        const childTop = childPos.y;

        // Vertical line from parent to midway point
        const verticalConnector = document.createElement('div');
        verticalConnector.className = 'parent-connector';
        verticalConnector.style.left = `${parentCenterX}px`;
        verticalConnector.style.top = `${parentBottom}px`;
        verticalConnector.style.width = '2px';
        verticalConnector.style.height = `${childTop - parentBottom}px`;
        treeContainer.appendChild(verticalConnector);

        // If child is not centered below parent, add horizontal connector
        if (Math.abs(parentCenterX - childCenterX) > 10) {
            const horizontalConnector = document.createElement('div');
            horizontalConnector.className = 'parent-connector';
            horizontalConnector.style.left = `${Math.min(parentCenterX, childCenterX)}px`;
            horizontalConnector.style.top = `${childTop}px`;
            horizontalConnector.style.width = `${Math.abs(parentCenterX - childCenterX)}px`;
            horizontalConnector.style.height = '2px';
            treeContainer.appendChild(horizontalConnector);
        }

        // Connection point at parent
        const parentConnector = document.createElement('div');
        parentConnector.className = 'connection-point';
        parentConnector.style.left = `${parentCenterX - 5}px`;
        parentConnector.style.top = `${parentBottom - 5}px`;
        parentConnector.style.width = '10px';
        parentConnector.style.height = '10px';
        parentConnector.style.backgroundColor = '#3498db';
        parentConnector.style.borderRadius = '50%';
        treeContainer.appendChild(parentConnector);
    }

    function drawMarriageConnector(pos1, pos2) {
        const centerY = pos1.y + 80;
        const leftX = Math.min(pos1.x, pos2.x) + 140;
        const rightX = Math.max(pos1.x, pos2.x);
        const width = rightX - leftX;

        if (width > 0) {
            const connector = document.createElement('div');
            connector.className = 'marriage-connector';
            connector.style.left = `${leftX}px`;
            connector.style.top = `${centerY}px`;
            connector.style.width = `${width}px`;
            treeContainer.appendChild(connector);

            // Add heart icon at center
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart marriage-heart';
            heart.style.left = `${leftX + width/2 - 6}px`;
            heart.style.top = `${centerY - 6}px`;
            treeContainer.appendChild(heart);
        }
    }

    function selectPerson(personId) {
        // Deselect all
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('selected');
        });

        // Select the clicked node
        const node = document.getElementById(`node-${personId}`);
        if (node) {
            node.classList.add('selected');
            selectedPersonId = personId;
            updateButtonStates();
        }
    }

    function updateButtonStates() {
        addChildBtn.disabled = !selectedPersonId;
        addSpouseBtn.disabled = !selectedPersonId || !!people.find(p => p.id === selectedPersonId)?.spouseId;
        editBtn.disabled = !selectedPersonId;
        deleteBtn.disabled = !selectedPersonId;
    }
});