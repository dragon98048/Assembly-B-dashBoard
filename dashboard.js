class QualityControlDashboard {
    constructor() {
        this.data = [];
        this.chartInstances = new Map();
        this.batchData = [];
        this.pumpData = {};
        this.analysisResults = {
            column: {},
            batch: {},
            pump: {}
        };
        
        // Specifications for Cp/Cpk calculations
        this.specifications = {
            'EL Before Weight': { lsl: 302, usl: 322 },
            'EL After Weight': { lsl: 338.7, usl: 346.5 },
            'EL Weight': { lsl: 36.7, usl: 37.5 }
        };
        
        // Chart color palette for consistency
        this.colorPalette = {
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            purple: '#8b5cf6',
            gradients: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(139, 92, 246, 0.8)'
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.showSection('column-analysis');
        this.setupChartContainers();
        this.updateAllSections();
    }
    
    setupChartContainers() {
        const chartContainers = document.querySelectorAll('.chart-card canvas');
        chartContainers.forEach(canvas => {
            canvas.style.maxHeight = '400px';
            canvas.style.height = '400px';
            canvas.style.width = '100%';
        });
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
            this.updateAllSections();
        });
        
        // Overview section
        document.getElementById('refreshOverview').addEventListener('click', () => {
            this.updateOverviewSection();
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
        
        // Chart type selectors - FIXED: All selectors now work
        document.querySelectorAll('.chart-type-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const chartId = e.target.dataset.chart;
                const chartType = e.target.value;
                const columnName = e.target.dataset.column;
                this.updateChartType(chartId, chartType, columnName);
            });
        });
        
        // Menu toggle
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Responsive handling
        window.addEventListener('resize', () => {
            this.handleResize();
            this.resizeAllCharts();
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
                    setTimeout(() => this.resizeAllCharts(), 100);
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
        } else if (this.data.length === 0 && sectionId !== 'overview') {
            this.showUploadSection();
        }
        
        // Update overview section when shown
        if (sectionId === 'overview') {
            this.updateOverviewSection();
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
        
        setTimeout(() => this.resizeAllCharts(), 300);
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
    
    resizeAllCharts() {
        setTimeout(() => {
            this.chartInstances.forEach((chart, chartId) => {
                try {
                    chart.resize();
                } catch (error) {
                    console.warn(`Error resizing chart ${chartId}:`, error);
                }
            });
        }, 300);
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
                this.updateAllSections();
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
    
    // FIXED: Update all sections when data changes
    updateAllSections() {
        this.updateOverviewSection();
        // Reset analysis results
        this.analysisResults = { column: {}, batch: {}, pump: {} };
    }
    
    // ENHANCED: Comprehensive overview section update
    updateOverviewSection() {
        if (this.data.length === 0) {
            this.clearOverviewData();
            return;
        }
        
        // Update basic stats
        document.getElementById('totalRecords').textContent = this.data.length;
        document.getElementById('recordsChange').textContent = 'Data loaded';
        document.getElementById('recordsChange').className = 'stat-change positive';
        
        // Calculate overall process capability
        this.calculateOverallCapability();
        
        // Update pump overview
        this.updatePumpOverview();
        
        // Create overview charts
        this.createOverviewCharts();
    }
    
    calculateOverallCapability() {
        const columns = Object.keys(this.specifications);
        let goodCount = 0;
        let acceptableCount = 0;
        let poorCount = 0;
        
        const summaryTableBody = document.getElementById('overviewSummaryTable');
        summaryTableBody.innerHTML = '';
        
        columns.forEach(column => {
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            // Count process statuses
            if (result.status === 'Good') goodCount++;
            else if (result.status === 'Acceptable') acceptableCount++;
            else poorCount++;
            
            // Calculate out of spec percentage
            const outOfSpec = columnData.filter(val => val < spec.lsl || val > spec.usl).length;
            const outOfSpecPercent = ((outOfSpec / columnData.length) * 100).toFixed(1);
            
            // Add to summary table
            const row = summaryTableBody.insertRow();
            row.innerHTML = `
                <td><strong>${column.replace('EL ', '')}</strong></td>
                <td>${result.cp.toFixed(3)}</td>
                <td>${result.cpk.toFixed(3)}</td>
                <td><span class="status-${result.status.toLowerCase()}">${result.status}</span></td>
                <td>${outOfSpecPercent}%</td>
            `;
        });
        
        // Update stat cards
        document.getElementById('goodProcess').textContent = goodCount;
        document.getElementById('acceptableProcess').textContent = acceptableCount;
        document.getElementById('poorProcess').textContent = poorCount;
        
        const total = goodCount + acceptableCount + poorCount;
        document.getElementById('goodChange').textContent = `${((goodCount/total)*100).toFixed(1)}%`;
        document.getElementById('acceptableChange').textContent = `${((acceptableCount/total)*100).toFixed(1)}%`;
        document.getElementById('poorChange').textContent = `${((poorCount/total)*100).toFixed(1)}%`;
        
        document.getElementById('goodChange').className = 'stat-change positive';
        document.getElementById('acceptableChange').className = 'stat-change neutral';
        document.getElementById('poorChange').className = 'stat-change negative';
    }
    
    updatePumpOverview() {
        const pumpCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const pumpCpks = { 1: [], 2: [], 3: [], 4: [] };
        
        this.data.forEach(row => {
            const pump = row['EL Filling Pump Number'];
            if (pump >= 1 && pump <= 4) {
                pumpCounts[pump]++;
                
                // Calculate average Cpk for this pump across all columns
                const columns = Object.keys(this.specifications);
                let pumpAvgCpk = 0;
                columns.forEach(column => {
                    const pumpData = this.data
                        .filter(r => r['EL Filling Pump Number'] === pump)
                        .map(r => r[column])
                        .filter(val => !isNaN(val));
                    
                    if (pumpData.length > 0) {
                        const spec = this.specifications[column];
                        const result = this.calculateCpCpk(pumpData, spec.lsl, spec.usl);
                        pumpAvgCpk += result.cpk;
                    }
                });
                pumpCpks[pump].push(pumpAvgCpk / columns.length);
            }
        });
        
        // Update pump cards
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`pump${i}-count`).textContent = `${pumpCounts[i]} samples`;
            const avgCpk = pumpCpks[i].length > 0 ? 
                pumpCpks[i].reduce((a, b) => a + b, 0) / pumpCpks[i].length : 0;
            document.getElementById(`pump${i}-avg`).textContent = `Avg Cpk: ${avgCpk.toFixed(3)}`;
        }
    }
    
    createOverviewCharts() {
        this.createOverviewCapabilityChart();
        this.createOverviewDistributionChart();
        this.createOverviewPumpChart();
        this.createOverviewTrendChart();
    }
    
    createOverviewCapabilityChart() {
        const canvas = document.getElementById('overviewCapabilityChart');
        if (!canvas) return;
        
        if (this.chartInstances.has('overviewCapabilityChart')) {
            this.chartInstances.get('overviewCapabilityChart').destroy();
        }
        
        const columns = Object.keys(this.specifications);
        const cpData = [];
        const cpkData = [];
        
        columns.forEach(column => {
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            cpData.push(result.cp);
            cpkData.push(result.cpk);
        });
        
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: columns.map(col => col.replace('EL ', '')),
                datasets: [{
                    label: 'Cp',
                    data: cpData,
                    backgroundColor: this.colorPalette.primary + '80',
                    borderColor: this.colorPalette.primary,
                    borderWidth: 2
                }, {
                    label: 'Cpk',
                    data: cpkData,
                    backgroundColor: this.colorPalette.success + '80',
                    borderColor: this.colorPalette.success,
                    borderWidth: 2
                }]
            },
            options: this.getOptimizedChartOptions('Overall Process Capability', 'bar')
        });
        
        this.chartInstances.set('overviewCapabilityChart', chart);
    }
    
    createOverviewDistributionChart() {
        const canvas = document.getElementById('overviewDistributionChart');
        if (!canvas) return;
        
        if (this.chartInstances.has('overviewDistributionChart')) {
            this.chartInstances.get('overviewDistributionChart').destroy();
        }
        
        const statusCounts = { Good: 0, Acceptable: 0, Poor: 0 };
        
        Object.keys(this.specifications).forEach(column => {
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            statusCounts[result.status]++;
        });
        
        const chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        this.colorPalette.success + 'CC',
                        this.colorPalette.warning + 'CC',
                        this.colorPalette.danger + 'CC'
                    ],
                    borderWidth: 3
                }]
            },
            options: this.getOptimizedChartOptions('Process Status Distribution', 'doughnut')
        });
        
        this.chartInstances.set('overviewDistributionChart', chart);
    }
    
    createOverviewPumpChart() {
        const canvas = document.getElementById('overviewPumpChart');
        if (!canvas) return;
        
        if (this.chartInstances.has('overviewPumpChart')) {
            this.chartInstances.get('overviewPumpChart').destroy();
        }
        
        const pumpData = [];
        for (let i = 1; i <= 4; i++) {
            const pumpRecords = this.data.filter(row => row['EL Filling Pump Number'] === i);
            pumpData.push(pumpRecords.length);
        }
        
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Pump 1', 'Pump 2', 'Pump 3', 'Pump 4'],
                datasets: [{
                    label: 'Sample Count',
                    data: pumpData,
                    backgroundColor: this.colorPalette.gradients,
                    borderColor: this.colorPalette.primary,
                    borderWidth: 2
                }]
            },
            options: this.getOptimizedChartOptions('Sample Distribution by Pump', 'bar')
        });
        
        this.chartInstances.set('overviewPumpChart', chart);
    }
    
    createOverviewTrendChart() {
        const canvas = document.getElementById('overviewTrendChart');
        if (!canvas) return;
        
        if (this.chartInstances.has('overviewTrendChart')) {
            this.chartInstances.get('overviewTrendChart').destroy();
        }
        
        // Create trend data by splitting data into chunks
        const chunkSize = Math.max(50, Math.floor(this.data.length / 10));
        const chunks = [];
        for (let i = 0; i < this.data.length; i += chunkSize) {
            chunks.push(this.data.slice(i, i + chunkSize));
        }
        
        const trendData = chunks.map((chunk, index) => {
            const avgCpk = Object.keys(this.specifications).reduce((sum, column) => {
                const columnData = chunk.map(row => row[column]).filter(val => !isNaN(val));
                const spec = this.specifications[column];
                const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
                return sum + result.cpk;
            }, 0) / Object.keys(this.specifications).length;
            
            return avgCpk;
        });
        
        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: chunks.map((_, index) => `Period ${index + 1}`),
                datasets: [{
                    label: 'Average Cpk',
                    data: trendData,
                    borderColor: this.colorPalette.primary,
                    backgroundColor: this.colorPalette.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: this.getOptimizedChartOptions('Process Stability Trend', 'line')
        });
        
        this.chartInstances.set('overviewTrendChart', chart);
    }
    
    clearOverviewData() {
        document.getElementById('totalRecords').textContent = '0';
        document.getElementById('goodProcess').textContent = '0';
        document.getElementById('acceptableProcess').textContent = '0';
        document.getElementById('poorProcess').textContent = '0';
        
        document.getElementById('recordsChange').textContent = 'No data';
        document.getElementById('goodChange').textContent = '0%';
        document.getElementById('acceptableChange').textContent = '0%';
        document.getElementById('poorChange').textContent = '0%';
        
        // Clear summary table
        const summaryTableBody = document.getElementById('overviewSummaryTable');
        summaryTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No analysis data available</td></tr>';
        
        // Clear pump overview
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`pump${i}-count`).textContent = '0 samples';
            document.getElementById(`pump${i}-avg`).textContent = 'Avg Cpk: 0.00';
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
        
        this.analysisResults.column = columnResults;
        this.createColumnCharts(columnResults);
        this.updateOverviewSection(); // Update overview after analysis
    }
    
    // Create scatter plot data
    createScatterPlotData(data, spec) {
        if (!data || data.length === 0) {
            return {
                datasets: [{
                    label: 'Data Points',
                    data: [],
                    backgroundColor: this.colorPalette.primary + '80',
                    borderColor: this.colorPalette.primary,
                    borderWidth: 1
                }]
            };
        }
        
        const validData = data.filter(val => !isNaN(val) && val !== null);
        const scatterData = validData.map((value, index) => ({
            x: index + 1,
            y: value
        }));
        
        const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
        
        return {
            datasets: [{
                label: 'Measurements',
                data: scatterData,
                backgroundColor: this.colorPalette.primary + '60',
                borderColor: this.colorPalette.primary,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }, {
                label: 'LSL',
                type: 'line',
                data: scatterData.map(point => ({ x: point.x, y: spec.lsl })),
                borderColor: this.colorPalette.danger,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                borderDash: [5, 5]
            }, {
                label: 'USL',
                type: 'line',
                data: scatterData.map(point => ({ x: point.x, y: spec.usl })),
                borderColor: this.colorPalette.danger,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                borderDash: [5, 5]
            }, {
                label: 'Mean',
                type: 'line',
                data: scatterData.map(point => ({ x: point.x, y: mean })),
                borderColor: this.colorPalette.success,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                borderDash: [10, 5]
            }]
        };
    }
    
    createOptimizedHistogramData(data, spec, bins = 25) {
        if (!data || data.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Frequency',
                    data: [],
                    backgroundColor: this.colorPalette.primary + '80',
                    borderColor: this.colorPalette.primary,
                    borderWidth: 1
                }]
            };
        }
        
        const validData = data.filter(val => !isNaN(val) && val !== null);
        const min = Math.min(...validData);
        const max = Math.max(...validData);
        const binWidth = (max - min) / bins;
        
        const histogram = new Array(bins).fill(0);
        const labels = [];
        
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
        }
        
        validData.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            histogram[binIndex]++;
        });
        
        const maxFreq = Math.max(...histogram);
        const lslPosition = Math.floor((spec.lsl - min) / binWidth);
        const uslPosition = Math.floor((spec.usl - min) / binWidth);
        
        return {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: histogram,
                backgroundColor: this.colorPalette.primary + '60',
                borderColor: this.colorPalette.primary,
                borderWidth: 1.5,
                borderRadius: 2
            }, {
                label: 'LSL',
                type: 'line',
                data: labels.map((_, i) => i === lslPosition ? maxFreq * 1.1 : null),
                borderColor: this.colorPalette.danger,
                backgroundColor: 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0,
                fill: false
            }, {
                label: 'USL',
                type: 'line',
                data: labels.map((_, i) => i === uslPosition ? maxFreq * 1.1 : null),
                borderColor: this.colorPalette.danger,
                backgroundColor: 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0,
                fill: false
            }]
        };
    }
    
    getOptimizedChartOptions(title, type = 'histogram') {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: type !== 'histogram',
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: this.colorPalette.primary,
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false
                }
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 6
                },
                line: {
                    tension: 0.2
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: type === 'histogram' ? 'Value Range' : 
                              type === 'scatter' ? 'Sample Number' : 'Categories',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        lineWidth: 1
                    },
                    ticks: {
                        maxRotation: 45,
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: type !== 'scatter',
                    title: {
                        display: true,
                        text: type === 'histogram' ? 'Frequency' : 
                              type === 'scatter' ? 'Value' : 'Value',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            }
        };
        
        if (type === 'pie' || type === 'doughnut') {
            delete baseOptions.scales;
            delete baseOptions.layout;
            baseOptions.plugins.legend.position = 'bottom';
            baseOptions.plugins.tooltip.callbacks = {
                label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((context.parsed * 100) / total).toFixed(1);
                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
            };
        }
        
        if (type === 'scatter') {
            baseOptions.plugins.legend.display = true;
            baseOptions.scales.x.type = 'linear';
            baseOptions.scales.y.beginAtZero = false;
        }
        
        return baseOptions;
    }
    
    createChart(canvasId, type, data, options) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas with ID ${canvasId} not found`);
            return null;
        }
        
        const container = canvas.parentElement;
        if (container) {
            container.style.height = '500px';
            container.style.position = 'relative';
        }
        
        if (this.chartInstances.has(canvasId)) {
            this.chartInstances.get(canvasId).destroy();
        }
        
        try {
            const chart = new Chart(canvas, {
                type: type,
                data: data,
                options: {
                    ...options,
                    onResize: (chart, size) => {
                        if (size.height > 500) {
                            chart.canvas.parentElement.style.height = '500px';
                            chart.resize();
                        }
                    }
                }
            });
            
            this.chartInstances.set(canvasId, chart);
            
            setTimeout(() => {
                chart.resize();
            }, 100);
            
            return chart;
        } catch (error) {
            console.error(`Error creating chart ${canvasId}:`, error);
            return null;
        }
    }
    
    createColumnCharts(results) {
        const columns = Object.keys(this.specifications);
        const chartIds = ['chart1', 'chart2', 'chart3'];
        
        columns.forEach((column, index) => {
            const chartId = chartIds[index];
            const columnData = this.data.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            
            const histogramData = this.createOptimizedHistogramData(columnData, spec);
            const options = this.getOptimizedChartOptions(`${column} Distribution`, 'histogram');
            
            this.createChart(chartId, 'bar', histogramData, options);
        });
        
        this.createOptimizedCpkComparisonChart(results);
    }
    
    createOptimizedCpkComparisonChart(results) {
        const columns = Object.keys(results);
        const cpData = columns.map(col => Number(results[col].cp.toFixed(3)));
        const cpkData = columns.map(col => Number(results[col].cpk.toFixed(3)));
        
        const data = {
            labels: columns.map(col => col.replace('EL ', '')),
            datasets: [{
                label: 'Cp (Process Capability)',
                data: cpData,
                backgroundColor: this.colorPalette.primary + '80',
                borderColor: this.colorPalette.primary,
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false
            }, {
                label: 'Cpk (Process Capability Index)',
                data: cpkData,
                backgroundColor: this.colorPalette.success + '80',
                borderColor: this.colorPalette.success,
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false
            }]
        };
        
        const options = this.getOptimizedChartOptions('Process Capability Comparison', 'bar');
        this.createChart('chart4', 'bar', data, options);
    }
    
    // FIXED: Chart type switching for all charts
    updateChartType(chartId, chartType, columnName) {
        if (!this.data.length) {
            alert('Please load data first');
            return;
        }
        
        const chartInstance = this.chartInstances.get(chartId);
        if (!chartInstance) {
            console.warn(`Chart ${chartId} not found`);
            return;
        }
        
        let newData, newType;
        const spec = this.specifications[columnName];
        const columnData = this.data.map(row => row[columnName]).filter(val => !isNaN(val));
        
        switch (chartType) {
            case 'scatter':
                newData = this.createScatterPlotData(columnData, spec);
                newType = 'scatter';
                break;
            case 'pie':
                const histogramData = this.createOptimizedHistogramData(columnData, spec);
                const sortedIndices = histogramData.datasets[0].data
                    .map((value, index) => ({ value, index }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 6);
                
                newData = {
                    labels: sortedIndices.map(item => histogramData.labels[item.index]),
                    datasets: [{
                        data: sortedIndices.map(item => item.value),
                        backgroundColor: this.colorPalette.gradients.slice(0, 6),
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                };
                newType = 'pie';
                break;
            case 'line':
                const lineData = this.createOptimizedHistogramData(columnData, spec);
                newData = {
                    ...lineData,
                    datasets: lineData.datasets.map(dataset => ({
                        ...dataset,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }))
                };
                newType = 'line';
                break;
            default: // histogram
                newData = this.createOptimizedHistogramData(columnData, spec);
                newType = 'bar';
                break;
        }
        
        // Update chart
        chartInstance.config.type = newType;
        chartInstance.data = newData;
        chartInstance.options = this.getOptimizedChartOptions(`${columnName} Distribution`, chartType);
        chartInstance.update('active');
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
        
        this.batchData = [];
        for (let i = 0; i < this.data.length; i += batchSize) {
            this.batchData.push(this.data.slice(i, i + batchSize));
        }
        
        const batchSelect = document.getElementById('batchSelect');
        batchSelect.innerHTML = '<option value="">Select a batch...</option>';
        this.batchData.forEach((batch, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Batch ${index + 1} (${batch.length} points)`;
            batchSelect.appendChild(option);
        });
        
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
        this.updateOverviewSection(); // Update overview after analysis
    }
    
    createBatchTrendChart() {
        const datasets = [];
        const colors = [this.colorPalette.primary, this.colorPalette.success, this.colorPalette.warning];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const cpkData = this.batchData.map((batch) => {
                const columnData = batch.map(row => row[column]).filter(val => !isNaN(val));
                const spec = this.specifications[column];
                const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
                return Number(result.cpk.toFixed(3));
            });
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: cpkData,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 8,
                pointBackgroundColor: colors[index],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            });
        });
        
        const data = {
            labels: this.batchData.map((_, index) => `Batch ${index + 1}`),
            datasets: datasets
        };
        
        const options = this.getOptimizedChartOptions('Cpk Trends Across Batches', 'line');
        this.createChart('batchTrendChart', 'line', data, options);
    }
    
    displaySelectedBatch(batchIndex) {
        if (!batchIndex || !this.batchData[batchIndex]) return;
        
        const batch = this.batchData[batchIndex];
        const datasets = [];
        const colors = [this.colorPalette.primary, this.colorPalette.success, this.colorPalette.warning];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const columnData = batch.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: [result.cp, result.cpk],
                backgroundColor: colors[index] + '80',
                borderColor: colors[index],
                borderWidth: 2
            });
        });
        
        const data = {
            labels: ['Cp', 'Cpk'],
            datasets: datasets
        };
        
        const options = this.getOptimizedChartOptions(`Batch ${parseInt(batchIndex) + 1} - Cp/Cpk Analysis`, 'bar');
        this.createChart('selectedBatchChart', 'bar', data, options);
    }
    
    calculatePumpCpk() {
        if (this.data.length === 0) {
            alert('Please upload data first or use sample data.');
            return;
        }
        
        const selectedPump = document.getElementById('pumpSelect').value;
        const pumpNumbers = selectedPump ? [selectedPump] : ['1', '2', '3', '4'];
        
        this.pumpData = {};
        pumpNumbers.forEach(pumpNum => {
            this.pumpData[pumpNum] = this.data.filter(row => 
                row['EL Filling Pump Number'].toString() === pumpNum
            );
        });
        
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
        
        this.analysisResults.pump = pumpResults;
        this.createPumpCharts(pumpResults);
        this.updateOverviewSection(); // Update overview after analysis
    }
    
    createPumpCharts(pumpResults) {
        const pumps = Object.keys(pumpResults);
        const columns = Object.keys(this.specifications);
        
        const datasets = columns.map((column, index) => ({
            label: column.replace('EL ', ''),
            data: pumps.map(pump => Number(pumpResults[pump][column]?.cpk.toFixed(3) || 0)),
            backgroundColor: this.colorPalette.gradients[index],
            borderColor: [this.colorPalette.primary, this.colorPalette.success, this.colorPalette.warning][index],
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
        }));
        
        const comparisonData = {
            labels: pumps.map(pump => `Pump ${pump}`),
            datasets: datasets
        };
        
        const comparisonOptions = this.getOptimizedChartOptions('Cpk Comparison by Pump', 'bar');
        this.createChart('pumpComparisonChart', 'bar', comparisonData, comparisonOptions);
        
        this.createOptimizedPumpSummaryChart(pumpResults);
        this.createOptimizedPumpOverallChart(pumpResults);
    }
    
    createOptimizedPumpSummaryChart(pumpResults) {
        const pumps = Object.keys(pumpResults);
        const avgCpk = pumps.map(pump => {
            const columns = Object.keys(pumpResults[pump]);
            const sum = columns.reduce((acc, col) => acc + pumpResults[pump][col].cpk, 0);
            return Number((sum / columns.length).toFixed(3));
        });
        
        const data = {
            labels: pumps.map(pump => `Pump ${pump}`),
            datasets: [{
                data: avgCpk,
                backgroundColor: this.colorPalette.gradients,
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 10
            }]
        };
        
        const options = this.getOptimizedChartOptions('Average Cpk by Pump', 'doughnut');
        options.cutout = '60%';
        
        this.createChart('pumpSummaryChart', 'doughnut', data, options);
    }
    
    createOptimizedPumpOverallChart(pumpResults) {
        const pumps = Object.keys(pumpResults);
        const statusCounts = { Good: 0, Acceptable: 0, Poor: 0 };
        
        pumps.forEach(pump => {
            Object.keys(pumpResults[pump]).forEach(column => {
                const status = pumpResults[pump][column].status;
                statusCounts[status]++;
            });
        });
        
        const data = {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    this.colorPalette.success + 'CC',
                    this.colorPalette.warning + 'CC',
                    this.colorPalette.danger + 'CC'
                ],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 15
            }]
        };
        
        const options = this.getOptimizedChartOptions('Process Status Distribution', 'pie');
        this.createChart('pumpOverallChart', 'pie', data, options);
    }
    
    displaySelectedPump(pumpNum) {
        if (!pumpNum || !this.pumpData[pumpNum]) return;
        
        const pumpDataPoints = this.pumpData[pumpNum];
        const datasets = [];
        const colors = [this.colorPalette.primary, this.colorPalette.success, this.colorPalette.warning];
        
        Object.keys(this.specifications).forEach((column, index) => {
            const columnData = pumpDataPoints.map(row => row[column]).filter(val => !isNaN(val));
            const spec = this.specifications[column];
            const result = this.calculateCpCpk(columnData, spec.lsl, spec.usl);
            
            datasets.push({
                label: column.replace('EL ', ''),
                data: [result.cp, result.cpk],
                backgroundColor: colors[index] + '80',
                borderColor: colors[index],
                borderWidth: 2
            });
        });
        
        const data = {
            labels: ['Cp', 'Cpk'],
            datasets: datasets
        };
        
        const options = this.getOptimizedChartOptions(`Pump ${pumpNum} - Cp/Cpk Analysis`, 'bar');
        this.createChart('selectedPumpChart', 'bar', data, options);
    }
    
downloadReport(type) {
    // CHANGE 1: Fix the library check
    if (typeof window.jspdf === 'undefined') {  // ✅ Changed from window.jsPDF to window.jspdf
        alert('PDF generation library not loaded. Please check your internet connection and refresh the page.');
        return;
    }
    
    try {
        // CHANGE 2: Fix the library access
        const { jsPDF } = window.jspdf;  // ✅ Changed from window.jsPDF to window.jspdf
        const pdf = new jsPDF();
        
        // Add title
        pdf.setFontSize(20);
        pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Analysis Report`, 20, 30);
        
        // Add timestamp
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
        pdf.text(`Total Records: ${this.data.length}`, 20, 55);
        
        // Add specifications
        pdf.setFontSize(14);
        pdf.text('Specifications:', 20, 75);
        pdf.setFontSize(10);
        
        let yPosition = 85;
        Object.keys(this.specifications).forEach(column => {
            const spec = this.specifications[column];
            pdf.text(`${column}: LSL=${spec.lsl}, USL=${spec.usl}`, 25, yPosition);
            yPosition += 10;
        });
        
        // Add analysis results if available
        if (this.analysisResults[type] && Object.keys(this.analysisResults[type]).length > 0) {
            yPosition += 10;
            pdf.setFontSize(14);
            pdf.text('Analysis Results:', 20, yPosition);
            yPosition += 10;
            pdf.setFontSize(10);
            
            Object.keys(this.analysisResults[type]).forEach(key => {
                const result = this.analysisResults[type][key];
                if (result.cp !== undefined) {
                    pdf.text(`${key}: Cp=${result.cp.toFixed(3)}, Cpk=${result.cpk.toFixed(3)}, Status=${result.status}`, 25, yPosition);
                    yPosition += 8;
                }
            });
        }
        
        // Save the PDF
        pdf.save(`${type}-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please check the console for details.');
    }
}

    
    /**
     * Cleanup method to prevent memory leaks
     */
    destroyAllCharts() {
        this.chartInstances.forEach((chart, chartId) => {
            try {
                chart.destroy();
            } catch (error) {
                console.warn(`Error destroying chart ${chartId}:`, error);
            }
        });
        this.chartInstances.clear();
    }
    
    /**
     * Update existing chart data efficiently
     */
    updateChartData(chartId, newData) {
        const chart = this.chartInstances.get(chartId);
        if (chart) {
            chart.data = newData;
            chart.update('none'); // Update without animation for better performance
        }
    }
}

// Initialize the optimized dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.qualityDashboard = new QualityControlDashboard();
    
    // Cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        if (window.qualityDashboard) {
            window.qualityDashboard.destroyAllCharts();
        }
    });
});
