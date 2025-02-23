let myChart = null; // Store the chart instance globally

function calculateSocialSecurityBreakeven(benefitFra, annualReturn, startAgeEarly, startAgeLate, maxAge) {
    function calculateBenefitAdjustment(claimingAge) {
        const fraMonths = 67 * 12;
        const claimingMonths = claimingAge * 12;
        const monthsDifference = claimingMonths - fraMonths;

        if (monthsDifference < 0) {
            if (monthsDifference >= -36) {
                const reduction = monthsDifference * (5 / 9 / 100);
                return benefitFra * (1 + reduction);
            } else {
                const reduction = (-36 * (5 / 9 / 100)) + ((monthsDifference + 36) * (5 / 12 / 100));
                return benefitFra * (1 + reduction);
            }
        } else if (monthsDifference > 0) {
            const increase = monthsDifference * (2 / 3 / 100);
            return benefitFra * (1 + increase);
        } else {
            return benefitFra;
        }
    }

    const benefitEarly = calculateBenefitAdjustment(startAgeEarly);
    const benefitLate = calculateBenefitAdjustment(startAgeLate);

    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const results = { [`age_${startAgeEarly}`]: [], [`age_${startAgeLate}`]: [] };
    let cumulativeEarly = 0;
    let cumulativeLate = 0;

    for (let age = Math.min(startAgeEarly, startAgeLate); age <= maxAge; age++) {
        if (age >= startAgeEarly) {
            for (let month = 0; month < 12; month++) {
                cumulativeEarly += benefitEarly;
                cumulativeEarly *= (1 + monthlyReturn);
            }
            results[`age_${startAgeEarly}`].push(cumulativeEarly);
        } else {
            results[`age_${startAgeEarly}`].push(0);
        }

        if (age >= startAgeLate) {
            for (let month = 0; month < 12; month++) {
                cumulativeLate += benefitLate;
                cumulativeLate *= (1 + monthlyReturn);
            }
            results[`age_${startAgeLate}`].push(cumulativeLate);
        } else {
            results[`age_${startAgeLate}`].push(0);
        }
    }

    let breakevenAge = null;
        const start_index_late = startAgeLate - startAgeEarly
    for (let i = start_index_late; i < results[`age_${startAgeEarly}`].length; i++) {
        if (results[`age_${startAgeLate}`][i] > results[`age_${startAgeEarly}`][i]) {
            breakevenAge = i + startAgeEarly;
            break;
        }
    }
    return { results, breakevenAge };
}

function plotBreakeven(results, startAgeEarly, startAgeLate) {
    const ages = Array.from({ length: results[`age_${startAgeEarly}`].length }, (_, i) => i + Math.min(startAgeEarly, startAgeLate));

    const ctx = document.getElementById('breakevenChart').getContext('2d');

    // Destroy the previous chart instance if it exists
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ages,
            datasets: [{
                label: `Claim at ${startAgeEarly}`,
                data: results[`age_${startAgeEarly}`],
                borderColor: 'blue',
                fill: false
            }, {
                label: `Claim at ${startAgeLate}`,
                data: results[`age_${startAgeLate}`],
                borderColor: 'red',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow custom height
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Benefits'
                    }
                }
            }
        }
    });
}

function calculateAndDisplay() {
    const benefitFra = parseFloat(document.getElementById('benefitFra').value);
    const startAgeEarly = parseInt(document.getElementById('startAgeEarly').value);
    const startAgeLate = parseInt(document.getElementById('startAgeLate').value);
    const annualReturn = parseFloat(document.getElementById('annualReturn').value) / 100;
    const maxAge = parseInt(document.getElementById('maxAge').value);

    if (startAgeEarly >= startAgeLate) {
        alert("The earlier starting age must be less than the later starting age.");
        return;
    }

    const { results, breakevenAge } = calculateSocialSecurityBreakeven(benefitFra, annualReturn, startAgeEarly, startAgeLate, maxAge);

    plotBreakeven(results, startAgeEarly, startAgeLate);

    const breakevenResultElement = document.getElementById('breakevenResult');
    if (breakevenAge !== null) {
        breakevenResultElement.textContent = `The breakeven age is approximately: ${breakevenAge}`;
    } else {
        breakevenResultElement.textContent = "Breakeven not reached by the maximum age considered.";
    }

    // Update table
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = ''; // Clear previous table data
    const ages = Array.from({ length: results[`age_${startAgeEarly}`].length }, (_, i) => i + Math.min(startAgeEarly, startAgeLate));

     // Update table headers with correct ages
    document.getElementById('earlyAgeHeader').textContent = `Cumulative Benefit (Age ${startAgeEarly})`;
    document.getElementById('lateAgeHeader').textContent = `Cumulative Benefit (Age ${startAgeLate})`;

    for (let i = 0; i < ages.length; i++) {
        const row = document.createElement('tr');
        const ageCell = document.createElement('td');
        const earlyBenefitCell = document.createElement('td');
        const lateBenefitCell = document.createElement('td');

        ageCell.textContent = ages[i];
        earlyBenefitCell.textContent = results[`age_${startAgeEarly}`][i].toFixed(2);
        lateBenefitCell.textContent = results[`age_${startAgeLate}`][i].toFixed(2);

        row.appendChild(ageCell);
        row.appendChild(earlyBenefitCell);
        row.appendChild(lateBenefitCell);
        tableBody.appendChild(row);
    }
}

// Initial calculation on page load (using default values)
window.onload = calculateAndDisplay;