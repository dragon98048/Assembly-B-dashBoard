class QualityControlDashboard {
    constructor() {
        this.data = [];
        this.charts = {};
        this.batchData = [];
        this.pumpData = {};
        
        // Specifications for Cp/Cpk calculations
        this.specifications = {
            'EL Before Weight': { lsl: 302, usl: 322 },
            'EL After Weight': { lsl: 338.7, usl: 346.5 },
            'EL Weight': { lsl: 36.7, usl: 37.5 }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.showSection('column-analysis');
        this.updateOverviewStats();
    }
    
    setupEventListeners() {
        // File upload
        document.getElementById('uploadDataBtn').addEventListener('click', () => {
            document.getElementById('csvFileInput').click();
        });
        
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Sample data
        document.getElementById('useSampleData').addEventListener('click', () => {
            this.generateSampleData();
            this.hideUploadSection();
            this.updateOverviewStats();
        });
        
        // Column analysis
        document.getElementById('calculateColumnCpk').addEventListener('click', () => {
            this.calculateColumnCpk();
        });
        
        document.getElementById('downloadColumnReport').addEventListener('click', () => {
            this.downloadReport('column');
        });
        
        // Batch analysis
        document.getElementById('calculateBatchCpk').addEventListener('click', () => {
            this.calculateBatchCpk();
        });
        
        document.getElementById('batchSelect').addEventListener('change', (e) => {
            this.displaySelectedBatch(e.target.value);
        });
        
        document.getElementById('downloadBatchReport').addEventListener('click', () => {
            this.downloadReport('batch');
        });
        
        // Pump analysis
        document.getElementById('calculatePumpCpk').addEventListener('click', () => {
            this.calculatePumpCpk();
        });
        
        document.getElementById('pumpSelect').addEventListener('change', (e) => {
            this.displaySelectedPump(e.target.value);
        });
        
        document.getElementById('downloadPumpReport').addEventListener('click', () => {
            this.downloadReport('pump');
        });
        
        // Chart type selectors
        document.querySelectorAll('.chart-type-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                this.updateChartType(e.target.dataset.chart, e.target.value);
            });
        });
        
        // Menu toggle
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Responsive handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                if (section) {
                    this.showSection(section);
                    this.setActiveNav(e.target.closest('.nav-link'));
                }
            });
        });
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.analysis-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Hide upload section if data is loaded
        if (this.data.length > 0 && sectionId !== 'overview') {
            this.hideUploadSection();
        }
    }
    
    setActiveNav(activeLink) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeLink.parentElement.classList.add('active');
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 1024) {
            sidebar.classList.toggle('open');
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }
    
    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        } else {
            sidebar.classList.remove('open');
        }
    }
    
    hideUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
    }
    
    showUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    }
    
    generateSampleData() {
        console.log('Generating sample data...');
        this.data = [];
        
        // Generate 1000 sample data points
        for (let i = 0; i < 1000; i++) {
            const pumpNumber = Math.floor(Math.random() * 4) + 1;
            
            this.data.push({
                'EL Before Weight': this.generateNormalData(312, 3),
                'EL After Weight': this.generateNormalData(342.6, 1.5),
                'EL Weight': this.generateNormalData(37.1, 0.15),
                'EL Filling Pump Number': pumpNumber
            });
        }
        
        document.getElementById('fileName').textContent = `Sample data generated (${this.data.length} records)`;
        console.log('Sample data generated:', this.data.length, 'records');
    }
    
    generateNormalData(mean, stdDev) {
        // Box-Muller transformation for normal distribution
        const u = Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return mean + stdDev * z;
    }
    
    handleFileUpload(file) {
        if (!file) return;
        
        if (file.type !== 'text/csv') {
            alert('Please select a CSV file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSV(e.target.result);
                document.getElementById('fileName').textContent = `Uploaded: ${file.name} (${this.data.length} records)`;
                this.hideUploadSection();
                this.updateOverviewStats();
                console.log('File uploaded successfully:', this.data.length, 'records');
            } catch (error) {
                alert('Error parsing CSV file. Please check the format.');
                console.error('CSV parsing error:', error);
            }
        };
        reader.readAsText(file);
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must contain at least a header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Validate required columns
        const requiredColumns = ['EL Before Weight', 'EL After Weight', 'EL Weight', 'EL Filling Pump Number'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
        
        this.data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index];
                    row[header] = isNaN(value) || value === '' ? value : parseFloat(value);
                });
                this.data.push(row);
            }
        }
        
        if (this.data.length === 0) {
            throw new Error('No valid data rows found in CSV file');
        }
    }
    
    calculateCpCpk(data, lsl, usl) {
        if (!data || data.length < 2) {
            return {
                mean: 0,
                stdDev: 0,
                cp: 0,
                cpk: 0,
                status: 'Poor'
            };
        }
        
        const validData = data.filter(val => !isNaN(val) && val !== null);
        if (validData.length < 2) {
            return {
                mean: 0,
                stdDev: 0,
                cp: 0,
                cpk: 0,
                status: 'Poor'
            };
        }
        
        const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
        const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (validData.length - 1);
        const stdDev = Math.sqrt(variance);
        
        const cp = (usl - lsl) / (6 * stdDev);
        const cpkUpper = (usl - mean) / (3 * stdDev);
        const cpkLower = (mean - lsl) / (3 * stdDev);
        const cpk = Math.min(cpkUpper, cpkLower);
        
        return {
            mean: mean,
            stdDev: stdDev,
            cp: cp,
            cpk: cpk,
            status: this.getProcessStatus(cp, cpk)
        };
    }
    
    getProcessStatus(cp, cpk) {
        if (cpk >= 1.33 && cp >= 1.33) return 'Good';
        if (cpk >= 1.0 && cp >= 1.0) return 'Acceptable';
        return 'Poor';
    }
    
    calculateColumnCpk() {
        if (this.data.length === 0) {
            alert('Please upload data first or use sample data.');
            return;
        }
        
        const tbody = document.querySelector('#columnResultsTable tbody');
        tbody.innerHTML = '';
        
        const columnResults = {};
        
        Object.keys(this.specifications).forEach(column => {
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            columnResults[column] = result;
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${column}</strong></td>
                <td>${spec.lsl}</td>
                <td>${spec.usl}</td>
                <td>${result.mean.toFixed(3)}</td>
                <td>${result.stdDev.toFixed(3)}</td>
                <td>${result.cp.toFixed(3)}</td>
                <td>${result.cpk.toFixed(3)}</td>
                <td><span class="status-${result.status.toLowerCase()}">${result.status}</span></td>
            `;
        });
        
        this.createColumnCharts(columnResults);
    }
    
    createColumnCharts(results) {
        const columns = Object.keys(this.specifications);
        const chartIds = ['chart1', 'chart2', 'chart3'];
        
        // Create individual column charts
        columns.forEach((column, index) => {
            const chartId = chartIds[index];
            const canvas = document.getElementById(chartId);
            
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
            }
            
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            
            this.charts[chartId] = new Chart(canvas, {
                type: 'bar',
                data: this.createHistogramData(columnData, spec),
                options: this.getHistogramOptions(column)
            });
        });
        
        // Create comparison chart
        this.createCpkComparisonChart(results);
    }
    
    createHistogramData(data, spec) {
        const bins = 20;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
        
        const histogram = new Array(bins).fill(0);
        const labels = [];
        
        for (let i = 0; i < bins; i++) {
            labels.push((min + i * binWidth).toFixed(1));
        }
        
        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            histogram[binIndex]++;
        });
        
        return {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: histogram,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        };
    }
    
    getHistogramOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `${title} Distribution`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        };
    }
    
    createCpkComparisonChart(results) {
        const canvas = document.getElementById('chart4');
        
        if (this.charts['chart4']) {
            this.charts['chart4'].destroy();
        }
        
        const columns = Object.keys(results);
        const cpData = columns.map(col => results[col].cp);
        const cpkData = columns.map(col => results[col].cpk);
        
        this.charts['chart4'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: columns.map(col => col.replace('EL ', '')),
                datasets: [{
                    label: 'Cp',
                    data: cpData,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }, {
                    label: 'Cpk',
                    data: cpkData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Cp/Cpk Comparison'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Index Value'
                        }
                    }
                }
            }
        });
    }
    
    calculateBatchCpk() {
        if (this.data.length === 0) {
            alert('Please upload data first or use sample data.');
            return;
        }
        
        const batchSize = parseInt(document.getElementById('batchSize').value);
        if (batchSize < 10 || batchSize > this.data.length) {
            alert('Invalid batch size. Please enter a value between 10 and ' + this.data.length);
            return;
        }
        
        // Create batches
        this.batchData = [];
        for (let i = 0; i < this.data.length; i += batchSize) {
            this.batchData.push(this.data.slice(i, i + batchSize));
        }
        
        // Populate batch selector
        const batchSelect = document.getElementById('batchSelect');
        batchSelect.innerHTML = '<option value="">Select a batch...</option>';
        this.batchData.forEach((batch, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Batch ${index + 1} (${batch.length} points)`;
            batchSelect.appendChild(option);
        });
        
        // Calculate and display results
        const tbody = document.querySelector('#batchResultsTable tbody');
        tbody.innerHTML = '';
        
        this.batchData.forEach((batch, batchIndex) => {
            Object.keys(this.specifications).forEach(column => {
                const columnData = batch.map(row => row[column]).filter(val => !isNaN(val));
                const spec = this.specifications[column];
                const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>Batch ${batchIndex + 1}</td>
                    <td>${column}</td>
                    <td>${columnData.length}</td>
                    <td>${result.mean.toFixed(3)}</td>
                    <td>${result.stdDev.toFixed(3)}</td>
                    <td>${result.cp.toFixed(3)}</td>
                    <td>${result.cpk.toFixed(3)}</td>
                    <td><span class="status-${result.status.toLowerCase()}">${result.status}</span></td>
                `;
            });
        });
        
        this.createBatchTrendChart();
    }
    
    createBatchTrendChart() {
        const canvas = document.getElementById('batchTrendChart');
        
        if (this.charts['batchTrendChart']) {
            this.charts['batchTrendChart'].destroy();
        }
        
        const datasets = [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const cpkData = this.batchData.map((batch) => {
                const columnData = batch.map(row => row[column]).filter(val => !isNaN(val));
                const spec = this.specifications[column];
                const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
                return result.cpk;
            });
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: cpkData,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
        });
        
        this.charts['batchTrendChart'] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.batchData.map((_, index) => `Batch ${index + 1}`),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Cpk Trends Across Batches'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cpk Value'
                        }
                    }
                }
            }
        });
    }
    
    displaySelectedBatch(batchIndex) {
        if (!batchIndex || !this.batchData[batchIndex]) return;
        
        const canvas = document.getElementById('selectedBatchChart');
        
        if (this.charts['selectedBatchChart']) {
            this.charts['selectedBatchChart'].destroy();
        }
        
        const batch = this.batchData[batchIndex];
        const datasets = [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const columnData = batch.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: [result.cp, result.cpk],
                backgroundColor: colors[index] + '80',
                borderColor: colors[index],
                borderWidth: 1
            });
        });
        
        this.charts['selectedBatchChart'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Cp', 'Cpk'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Batch ${parseInt(batchIndex) + 1} - Cp/Cpk Analysis`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Index Value'
                        }
                    }
                }
            }
        });
    }
    
    calculatePumpCpk() {
        if (this.data.length === 0) {
            alert('Please upload data first or use sample data.');
            return;
        }
        
        const selectedPump = document.getElementById('pumpSelect').value;
        const pumpNumbers = selectedPump ? [selectedPump] : ['1', '2', '3', '4'];
        
        // Group data by pump
        this.pumpData = {};
        pumpNumbers.forEach(pumpNum => {
            this.pumpData[pumpNum] = this.data.filter(row => 
                row['EL Filling Pump Number'].toString() === pumpNum
            );
        });
        
        // Calculate and display results
        const tbody = document.querySelector('#pumpResultsTable tbody');
        tbody.innerHTML = '';
        
        const pumpResults = {};
        
        Object.keys(this.pumpData).forEach(pumpNum => {
            const pumpDataPoints = this.pumpData[pumpNum];
            pumpResults[pumpNum] = {};
            
            Object.keys(this.specifications).forEach(column => {
                const columnData = pumpDataPoints.map(row => row[column]).filter(val => !isNaN(val));
                const spec = this.specifications[column];
                const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
                
                pumpResults[pumpNum][column] = result;
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>Pump ${pumpNum}</td>
                    <td>${column}</td>
                    <td>${columnData.length}</td>
                    <td>${result.mean.toFixed(3)}</td>
                    <td>${result.stdDev.toFixed(3)}</td>
                    <td>${result.cp.toFixed(3)}</td>
                    <td>${result.cpk.toFixed(3)}</td>
                    <td><span class="status-${result.status.toLowerCase()}">${result.status}</span></td>
                `;
            });
        });
        
        this.createPumpCharts(pumpResults);
    }
    
    createPumpCharts(pumpResults) {
        // Pump comparison chart
        const comparisonCanvas = document.getElementById('pumpComparisonChart');
        if (this.charts['pumpComparisonChart']) {
            this.charts['pumpComparisonChart'].destroy();
        }
        
        const pumps = Object.keys(pumpResults);
        const columns = Object.keys(this.specifications);
        
        const datasets = columns.map((column, index) => ({
            label: column.replace('EL ', ''),
            data: pumps.map(pump => pumpResults[pump][column]?.cpk || 0),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'][index] + '80',
            borderColor: ['#3b82f6', '#10b981', '#f59e0b'][index],
            borderWidth: 1
        }));
        
        this.charts['pumpComparisonChart'] = new Chart(comparisonCanvas, {
            type: 'bar',
            data: {
                labels: pumps.map(pump => `Pump ${pump}`),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Cpk Comparison by Pump'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cpk Value'
                        }
                    }
                }
            }
        });
        
        // Pump summary chart
        this.createPumpSummaryChart(pumpResults);
        this.createPumpOverallChart(pumpResults);
    }
    
    createPumpSummaryChart(pumpResults) {
        const canvas = document.getElementById('pumpSummaryChart');
        if (this.charts['pumpSummaryChart']) {
            this.charts['pumpSummaryChart'].destroy();
        }
        
        const pumps = Object.keys(pumpResults);
        const avgCpk = pumps.map(pump => {
            const columns = Object.keys(pumpResults[pump]);
            const sum = columns.reduce((acc, col) => acc + pumpResults[pump][col].cpk, 0);
            return sum / columns.length;
        });
        
        this.charts['pumpSummaryChart'] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: pumps.map(pump => `Pump ${pump}`),
                datasets: [{
                    data: avgCpk,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Average Cpk by Pump'
                    }
                }
            }
        });
    }
    
    createPumpOverallChart(pumpResults) {
        const canvas = document.getElementById('pumpOverallChart');
        if (this.charts['pumpOverallChart']) {
            this.charts['pumpOverallChart'].destroy();
        }
        
        const pumps = Object.keys(pumpResults);
        const statusCounts = { Good: 0, Acceptable: 0, Poor: 0 };
        
        pumps.forEach(pump => {
            Object.keys(pumpResults[pump]).forEach(column => {
                const status = pumpResults[pump][column].status;
                statusCounts[status]++;
            });
        });
        
        this.charts['pumpOverallChart'] = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Overall Process Status Distribution'
                    }
                }
            }
        });
    }
    
    displaySelectedPump(pumpNum) {
        if (!pumpNum || !this.pumpData[pumpNum]) return;
        
        const canvas = document.getElementById('selectedPumpChart');
        
        if (this.charts['selectedPumpChart']) {
            this.charts['selectedPumpChart'].destroy();
        }
        
        const pumpDataPoints = this.pumpData[pumpNum];
        const datasets = [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const columnData = pumpDataPoints.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: [result.cp, result.cpk],
                backgroundColor: colors[index] + '80',
                borderColor: colors[index],
                borderWidth: 1
            });
        });
        
        this.charts['selectedPumpChart'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Cp', 'Cpk'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Pump ${pumpNum} - Cp/Cpk Analysis`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Index Value'
                        }
                    }
                }
            }
        });
    }
    
    updateChartType(chartId, chartType) {
        const chart = this.charts[chartId];
        if (!chart) return;
        
        // This is a simplified version - in practice, you'd need to restructure data
        // based on the chart type (histogram, pie, line)
        console.log(`Updating ${chartId} to ${chartType}`);
    }
    
    updateOverviewStats() {
        document.getElementById('totalRecords').textContent = this.data.length;
        
        // These would be updated based on actual calculations
        document.getElementById('goodProcess').textContent = '0';
        document.getElementById('needsAttention').textContent = '0';
        document.getElementById('poorProcess').textContent = '0';
    }
    
    downloadReport(type) {
        if (typeof window.jsPDF === 'undefined') {
            alert('PDF generation library not loaded. Please refresh the page and try again.');
            return;
        }
        
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF();
        
        // Add title
        pdf.setFontSize(20);
        pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Analysis Report`, 20, 30);
        
        // Add timestamp
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
        pdf.text(`Total Records: ${this.data.length}`, 20, 55);
        
        // Add data summary
        pdf.setFontSize(14);
        pdf.text('Data Summary:', 20, 75);
        pdf.setFontSize(10);
        
        let yPosition = 85;
        Object.keys(this.specifications).forEach(column => {
            const spec = this.specifications[column];
            pdf.text(`${column}: LSL=${spec.lsl}, USL=${spec.usl}`, 25, yPosition);
            yPosition += 10;
        });
        
        // Save the PDF
        pdf.save(`${type}-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.qualityDashboard = new QualityControlDashboard();
});
