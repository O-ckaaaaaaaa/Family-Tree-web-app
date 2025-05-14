document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chartCanvas = document.getElementById('chart-canvas');
    const newChartBtn = document.getElementById('new-chart');
    const saveChartBtn = document.getElementById('save-chart');
    const loadChartBtn = document.getElementById('load-chart');
    const addConnectorBtn = document.getElementById('add-connector');
    const toolButtons = document.querySelectorAll('.tool-button[data-type]');
    const colorOptions = document.querySelectorAll('.color-option');
    const familyMembersList = document.getElementById('family-members-list');
    const propertiesPanel = document.getElementById('properties-panel');
    const applyPropertiesBtn = document.getElementById('apply-properties');
    const deleteElementBtn = document.getElementById('delete-element');

    // App State
    let currentChart = {
        id: null,
        name: 'Untitled Chart',
        elements: [],
        connectors: [],
        createdAt: null,
        updatedAt: null
    };
    let familyMembers = [];
    let selectedElement = null;
    let isDrawingConnector = false;
    let connectorStartElement = null;
    let selectedColor = '#3498db';

    // Initialize
    loadFamilyMembers();
    createNewChart();
    setupEventListeners();

    // Functions
    function loadFamilyMembers() {
        // Load from localStorage or API
        const familyData = localStorage.getItem('familyTreeData');
        if (familyData) {
            try {
                familyMembers = JSON.parse(familyData).people || [];
                renderFamilyMembersList();
            } catch (e) {
                console.error('Error loading family members:', e);
            }
        }
    }

    function renderFamilyMembersList() {
        familyMembersList.innerHTML = '';
        familyMembers.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'family-member-item';
            memberItem.dataset.memberId = member.id;
            memberItem.innerHTML = `
                <i class="fas fa-user"></i> ${member.name}
            `;
            memberItem.addEventListener('click', () => {
                addFamilyMemberElement(member);
            });
            familyMembersList.appendChild(memberItem);
        });
    }

    function createNewChart() {
        currentChart = {
            id: Date.now().toString(),
            name: `New Chart ${new Date().toLocaleDateString()}`,
            elements: [],
            connectors: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        renderChart();
        updatePropertiesPanel();
    }

    function renderChart() {
        chartCanvas.innerHTML = '';

        // Render elements
        currentChart.elements.forEach(element => {
            createChartElement(element);
        });

        // Render connectors
        currentChart.connectors.forEach(connector => {
            createConnector(connector);
        });
    }

    function createChartElement(elementData) {
        const element = document.createElement('div');
        element.className = `chart-element ${elementData.type}-element`;
        element.dataset.elementId = elementData.id;
        element.dataset.elementType = elementData.type;

        // Position and size
        element.style.left = `${elementData.x}px`;
        element.style.top = `${elementData.y}px`;
        element.style.width = `${elementData.width}px`;
        element.style.height = `${elementData.height}px`;

        // Styles
        element.style.backgroundColor = elementData.backgroundColor || '';
        element.style.borderColor = elementData.borderColor || '';
        element.style.borderWidth = elementData.borderWidth || '2px';

        // Content
        if (elementData.type === 'family-member') {
            const member = familyMembers.find(m => m.id === elementData.content);
            if (member) {
                element.dataset.content = member.id;
                element.innerHTML = `
                    <div style="text-align:center;padding:0.5rem;">
                        <i class="fas fa-user" style="font-size:1.5rem;"></i>
                        <div style="margin-top:0.5rem;font-weight:500;">${member.name}</div>
                    </div>
                `;
            }
        }
        else if (elementData.type === 'text') {
            element.dataset.content = elementData.content || 'Double click to edit';
            element.textContent = elementData.content || 'Double click to edit';
            element.addEventListener('dblclick', function() {
                this.contentEditable = true;
                this.focus();
            });
            element.addEventListener('blur', function() {
                this.contentEditable = false;
                elementData.content = this.textContent;
                updateChart();
            });
        }
        else if (elementData.type === 'image') {
            element.dataset.content = elementData.content || '';
            if (elementData.content) {
                element.innerHTML = `<img src="${elementData.content}" alt="Image">`;
            } else {
                element.innerHTML = '<i class="fas fa-image" style="font-size:2rem;"></i>';
            }
        }

        // Make draggable and selectable
        setupElementInteractions(element);

        chartCanvas.appendChild(element);
        return element;
    }

    function createConnector(connectorData) {
        const connector = document.createElement('div');
        connector.className = 'connector';
        connector.dataset.connectorId = connectorData.id;
        connector.dataset.from = connectorData.from;
        connector.dataset.to = connectorData.to;

        // Calculate positions
        const fromElement = document.querySelector(`[data-element-id="${connectorData.from}"]`);
        const toElement = document.querySelector(`[data-element-id="${connectorData.to}"]`);

        if (!fromElement || !toElement) return;

        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const canvasRect = chartCanvas.getBoundingClientRect();

        const fromX = fromRect.left + fromRect.width/2 - canvasRect.left;
        const fromY = fromRect.top + fromRect.height/2 - canvasRect.top;
        const toX = toRect.left + toRect.width/2 - canvasRect.left;
        const toY = toRect.top + toRect.height/2 - canvasRect.top;

        // Position the connector
        connector.style.left = `${Math.min(fromX, toX)}px`;
        connector.style.top = `${Math.min(fromY, toY)}px`;
        connector.style.width = `${Math.abs(toX - fromX)}px`;
        connector.style.height = `${Math.abs(toY - fromY)}px`;

        // Create SVG path
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("stroke", selectedColor);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");

        // Calculate path points
        const relativeFromX = fromX - parseFloat(connector.style.left);
        const relativeFromY = fromY - parseFloat(connector.style.top);
        const relativeToX = toX - parseFloat(connector.style.left);
        const relativeToY = toY - parseFloat(connector.style.top);

        // Create a simple straight line for now
        path.setAttribute("d", `M${relativeFromX},${relativeFromY} L${relativeToX},${relativeToY}`);

        svg.appendChild(path);
        connector.appendChild(svg);

        chartCanvas.appendChild(connector);
        return connector;
    }

    function setupElementInteractions(element) {
        // Select on click
        element.addEventListener('click', function(e) {
            e.stopPropagation();
            selectElement(this);
        });

        // Make draggable
        element.addEventListener('mousedown', startDrag);

        // Handle resizing
        element.addEventListener('mousedown', function(e) {
            if (e.target === element) {
                const rect = element.getBoundingClientRect();
                const edgeSize = 10;

                // Right edge
                if (e.clientX > rect.right - edgeSize) {
                    e.preventDefault();
                    startResize(element, 'right');
                }
                // Bottom edge
                else if (e.clientY > rect.bottom - edgeSize) {
                    e.preventDefault();
                    startResize(element, 'bottom');
                }
                // Bottom-right corner
                else if (e.clientX > rect.right - edgeSize && e.clientY > rect.bottom - edgeSize) {
                    e.preventDefault();
                    startResize(element, 'both');
                }
            }
        });
    }

    function startDrag(e) {
        if (e.button !== 0 || isDrawingConnector) return;

        const element = this;
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = element.offsetLeft;
        const startTop = element.offsetTop;

        function moveHandler(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            element.style.left = `${startLeft + dx}px`;
            element.style.top = `${startTop + dy}px`;

            updateConnectorsForElement(element);
        }

        function upHandler() {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);

            // Update chart data
            const elementData = currentChart.elements.find(el => el.id === element.dataset.elementId);
            if (elementData) {
                elementData.x = element.offsetLeft;
                elementData.y = element.offsetTop;
                updateChart();
            }
        }

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);

        e.preventDefault();
    }

    function startResize(element, direction) {
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;

        function moveHandler(e) {
            if (direction === 'right' || direction === 'both') {
                const newWidth = startWidth + (e.clientX - startX);
                if (newWidth > 50) {
                    element.style.width = `${newWidth}px`;
                }
            }

            if (direction === 'bottom' || direction === 'both') {
                const newHeight = startHeight + (e.clientY - startY);
                if (newHeight > 30) {
                    element.style.height = `${newHeight}px`;
                }
            }

            updateConnectorsForElement(element);
        }

        function upHandler() {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);

            // Update chart data
            const elementData = currentChart.elements.find(el => el.id === element.dataset.elementId);
            if (elementData) {
                elementData.width = element.offsetWidth;
                elementData.height = element.offsetHeight;
                updateChart();
            }
        }

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);

        event.preventDefault();
    }

    function updateConnectorsForElement(element) {
        const elementId = element.dataset.elementId;
        const connectors = Array.from(document.querySelectorAll('.connector'));

        connectors.forEach(conn => {
            if (conn.dataset.from === elementId || conn.dataset.to === elementId) {
                const fromElement = document.querySelector(`[data-element-id="${conn.dataset.from}"]`);
                const toElement = document.querySelector(`[data-element-id="${conn.dataset.to}"]`);

                if (fromElement && toElement) {
                    const fromRect = fromElement.getBoundingClientRect();
                    const toRect = toElement.getBoundingClientRect();
                    const canvasRect = chartCanvas.getBoundingClientRect();

                    const fromX = fromRect.left + fromRect.width/2 - canvasRect.left;
                    const fromY = fromRect.top + fromRect.height/2 - canvasRect.top;
                    const toX = toRect.left + toRect.width/2 - canvasRect.left;
                    const toY = toRect.top + toRect.height/2 - canvasRect.top;

                    // Update connector position
                    conn.style.left = `${Math.min(fromX, toX)}px`;
                    conn.style.top = `${Math.min(fromY, toY)}px`;
                    conn.style.width = `${Math.abs(toX - fromX)}px`;
                    conn.style.height = `${Math.abs(toY - fromY)}px`;

                    // Update SVG path
                    const svg = conn.querySelector('svg');
                    if (svg) {
                        const path = svg.querySelector('path');
                        if (path) {
                            const relativeFromX = fromX - parseFloat(conn.style.left);
                            const relativeFromY = fromY - parseFloat(conn.style.top);
                            const relativeToX = toX - parseFloat(conn.style.left);
                            const relativeToY = toY - parseFloat(conn.style.top);

                            path.setAttribute("d", `M${relativeFromX},${relativeFromY} L${relativeToX},${relativeToY}`);
                        }
                    }
                }
            }
        });
    }

    function selectElement(element) {
        // Deselect all
        document.querySelectorAll('.chart-element').forEach(el => {
            el.classList.remove('selected');
        });

        // Select this element
        element.classList.add('selected');
        selectedElement = element;

        // Show properties panel
        updatePropertiesPanel();
    }

    function updatePropertiesPanel() {
        if (!selectedElement) {
            propertiesPanel.style.display = 'none';
            return;
        }

        propertiesPanel.style.display = 'block';

        // Set current values
        document.getElementById('element-content').value = selectedElement.dataset.content || '';
        document.getElementById('element-bg-color').value = rgbToHex(selectedElement.style.backgroundColor) || '#ffffff';
        document.getElementById('element-border-color').value = rgbToHex(selectedElement.style.borderColor) || '#3498db';
    }

    function applyElementProperties() {
        if (!selectedElement) return;

        const content = document.getElementById('element-content').value;
        const bgColor = document.getElementById('element-bg-color').value;
        const borderColor = document.getElementById('element-border-color').value;

        // Update element
        selectedElement.dataset.content = content;
        selectedElement.style.backgroundColor = bgColor;
        selectedElement.style.borderColor = borderColor;

        // Update content based on type
        const elementType = selectedElement.dataset.elementType;
        if (elementType === 'family-member') {
            const member = familyMembers.find(m => m.id === content);
            if (member) {
                selectedElement.innerHTML = `
                    <div style="text-align:center;padding:0.5rem;">
                        <i class="fas fa-user" style="font-size:1.5rem;"></i>
                        <div style="margin-top:0.5rem;font-weight:500;">${member.name}</div>
                    </div>
                `;
            }
        }
        else if (elementType === 'text') {
            selectedElement.textContent = content;
        }
        else if (elementType === 'image') {
            if (content) {
                selectedElement.innerHTML = `<img src="${content}" alt="Image">`;
            } else {
                selectedElement.innerHTML = '<i class="fas fa-image" style="font-size:2rem;"></i>';
            }
        }

        // Update chart data
        const elementData = currentChart.elements.find(el => el.id === selectedElement.dataset.elementId);
        if (elementData) {
            elementData.content = content;
            elementData.backgroundColor = bgColor;
            elementData.borderColor = borderColor;
            updateChart();
        }
    }

    function deleteSelectedElement() {
        if (!selectedElement || !confirm('Delete this element?')) return;

        // Remove from chart data
        currentChart.elements = currentChart.elements.filter(el => el.id !== selectedElement.dataset.elementId);

        // Remove any connectors
        currentChart.connectors = currentChart.connectors.filter(conn => {
            return conn.from !== selectedElement.dataset.elementId &&
                   conn.to !== selectedElement.dataset.elementId;
        });

        // Remove element and connectors from DOM
        document.querySelectorAll('.connector').forEach(conn => {
            if (conn.dataset.from === selectedElement.dataset.elementId ||
                conn.dataset.to === selectedElement.dataset.elementId) {
                conn.remove();
            }
        });

        selectedElement.remove();
        selectedElement = null;
        propertiesPanel.style.display = 'none';

        updateChart();
    }

    function addFamilyMemberElement(member) {
        if (!currentChart) return;

        const elementId = Date.now().toString();
        const element = {
            id: elementId,
            type: 'family-member',
            content: member.id,
            x: 50,
            y: 50,
            width: 120,
            height: 80,
            backgroundColor: '#e6f2fa',
            borderColor: selectedColor,
            borderWidth: '2px'
        };

        currentChart.elements.push(element);
        const el = createChartElement(element);
        selectElement(el);
        updateChart();
    }

    function addTextElement() {
        if (!currentChart) return;

        const elementId = Date.now().toString();
        const element = {
            id: elementId,
            type: 'text',
            content: 'Double click to edit',
            x: 50,
            y: 50,
            width: 150,
            height: 100,
            backgroundColor: '#fff8e1',
            borderColor: selectedColor,
            borderWidth: '2px'
        };

        currentChart.elements.push(element);
        const el = createChartElement(element);
        selectElement(el);
        updateChart();
    }

    function addImageElement() {
        if (!currentChart) return;

        const elementId = Date.now().toString();
        const element = {
            id: elementId,
            type: 'image',
            content: '',
            x: 50,
            y: 50,
            width: 150,
            height: 150,
            backgroundColor: '#e8f5e9',
            borderColor: selectedColor,
            borderWidth: '2px'
        };

        currentChart.elements.push(element);
        const el = createChartElement(element);
        selectElement(el);

        // In a real app, you would implement image upload here
        const imageUrl = prompt("Enter image URL:");
        if (imageUrl) {
            element.content = imageUrl;
            el.innerHTML = `<img src="${imageUrl}" alt="Image">`;
            updateChart();
        }
    }

    function startConnectorMode() {
        if (!selectedElement) {
            alert('Please select an element to connect from first');
            return;
        }

        isDrawingConnector = true;
        connectorStartElement = selectedElement;
        chartCanvas.style.cursor = 'crosshair';
        alert('Now click on another element to connect to');
    }

    function completeConnector(endElement) {
        if (!isDrawingConnector || !connectorStartElement || !endElement) return;

        const connectorId = Date.now().toString();
        const connector = {
            id: connectorId,
            from: connectorStartElement.dataset.elementId,
            to: endElement.dataset.elementId,
            color: selectedColor
        };

        currentChart.connectors.push(connector);
        createConnector(connector);
        updateChart();

        // Reset connector mode
        isDrawingConnector = false;
        connectorStartElement = null;
        chartCanvas.style.cursor = '';
    }

    function saveChart() {
        if (!currentChart) return;

        currentChart.updatedAt = new Date().toISOString();

        // Save to localStorage
        const savedCharts = JSON.parse(localStorage.getItem('familyCharts') || '[]');
        const existingIndex = savedCharts.findIndex(c => c.id === currentChart.id);

        if (existingIndex >= 0) {
            savedCharts[existingIndex] = currentChart;
        } else {
            savedCharts.push(currentChart);
        }

        localStorage.setItem('familyCharts', JSON.stringify(savedCharts));
        alert('Chart saved successfully!');
    }

    function loadChart() {
        const savedCharts = JSON.parse(localStorage.getItem('familyCharts') || '[]');

        if (savedCharts.length === 0) {
            alert('No saved charts found');
            return;
        }

        const chartNames = savedCharts.map(c => c.name);
        const chartToLoad = prompt(`Enter chart name to load:\n${chartNames.join('\n')}`);

        if (!chartToLoad) return;

        const chart = savedCharts.find(c => c.name === chartToLoad);
        if (chart) {
            currentChart = chart;
            renderChart();
            alert(`Loaded chart: ${chart.name}`);
        } else {
            alert('Chart not found');
        }
    }

    function updateChart() {
        currentChart.updatedAt = new Date().toISOString();
    }

    function rgbToHex(rgb) {
        if (!rgb) return '';
        if (rgb.startsWith('#')) return rgb;

        // Convert rgb(r, g, b) to hex
        const matches = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!matches) return '';

        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }

        return "#" + hex(matches[1]) + hex(matches[2]) + hex(matches[3]);
    }

    function setupEventListeners() {
        // Button events
        newChartBtn.addEventListener('click', createNewChart);
        saveChartBtn.addEventListener('click', saveChart);
        loadChartBtn.addEventListener('click', loadChart);
        addConnectorBtn.addEventListener('click', startConnectorMode);

        // Tool buttons
        toolButtons.forEach(button => {
            button.addEventListener('click', function() {
                const type = this.dataset.type;

                switch(type) {
                    case 'text':
                        addTextElement();
                        break;
                    case 'image':
                        addImageElement();
                        break;
                }
            });
        });

        // Color options
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedColor = this.dataset.color;
            });
        });

        // Properties panel
        applyPropertiesBtn.addEventListener('click', applyElementProperties);
        deleteElementBtn.addEventListener('click', deleteSelectedElement);

        // Chart canvas click
        chartCanvas.addEventListener('click', function(e) {
            if (isDrawingConnector && e.target.classList.contains('chart-element')) {
                completeConnector(e.target);
            } else if (e.target === chartCanvas) {
                // Clicked on empty space - deselect
                if (selectedElement) {
                    selectedElement.classList.remove('selected');
                    selectedElement = null;
                    propertiesPanel.style.display = 'none';
                }
                if (isDrawingConnector) {
                    isDrawingConnector = false;
                    connectorStartElement = null;
                    chartCanvas.style.cursor = '';
                }
            }
        });
    }
});