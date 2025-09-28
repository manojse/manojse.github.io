// emi-calculator.js - rewritten from car-loan.html

function pad(n) { return n < 10 ? '0' + n : n; }
function formatNumber(num) { return num.toLocaleString('en-IN'); }
function numberToWords(num) {
	if (isNaN(num) || num < 1) return '';
	const units = ['', 'Thousand', 'Lakh', 'Crore'];
	let str = '';
	let n = Math.floor(num);
	let i = 0;
	while (n > 0 && i < units.length) {
		let part = n % (i === 0 ? 1000 : 100);
		if (part > 0) {
			str = part + ' ' + units[i] + (str ? ' ' + str : '');
		}
		n = Math.floor(n / (i === 0 ? 1000 : 100));
		i++;
	}
	return str.trim();
}

document.addEventListener('DOMContentLoaded', function() {
	// Principal sync
	const principalSlider = document.getElementById('principalSlider');
	const principalInput = document.getElementById('principal');
	const principalWords = document.getElementById('principalWords');
	function updatePrincipalDisplay(val) {
		let raw = val.replace(/[^\d]/g, '');
		if (!raw) raw = '0';
		let numVal = Number(raw);
		principalInput.value = numVal;
		principalSlider.value = numVal;
		principalWords.textContent = numberToWords(numVal);
	}
	principalSlider.addEventListener('input', e => updatePrincipalDisplay(e.target.value));
	principalInput.addEventListener('input', e => updatePrincipalDisplay(e.target.value));
	updatePrincipalDisplay(principalInput.value);

	// Rate sync
	const rateSlider = document.getElementById('rateSlider');
	const rateInput = document.getElementById('rate');
	function updateRateDisplay(val, source) {
		let floatVal = parseFloat(val);
		if (isNaN(floatVal)) floatVal = 0;
		floatVal = Math.max(1, Math.min(20, floatVal));
		if (source === 'slider') rateInput.value = floatVal;
		else rateSlider.value = floatVal;
	}
	rateSlider.addEventListener('input', e => updateRateDisplay(e.target.value, 'slider'));
	rateInput.addEventListener('input', e => updateRateDisplay(e.target.value, 'input'));
	updateRateDisplay(rateInput.value, 'input');

	// Tenure sync
	const tenureSlider = document.getElementById('tenureSlider');
	const tenureInput = document.getElementById('tenure');
	const toggleTenureUnit = document.getElementById('toggleTenureUnit');
	const tenureUnitLabel = document.getElementById('tenureUnitLabel');
	let tenureUnit = 'months';
	function updateTenureDisplay(val, source) {
		let numVal = parseFloat(val);
		if (isNaN(numVal)) numVal = 0;
		if (tenureUnit === 'months') {
			numVal = Math.max(6, Math.min(360, numVal));
			if (source === 'slider') tenureInput.value = numVal;
			else tenureSlider.value = numVal;
		} else {
			numVal = Math.max(0.5, Math.min(30, numVal));
			if (source === 'slider') tenureInput.value = (parseInt(tenureSlider.value) / 12).toFixed(2);
			else tenureSlider.value = Math.round(numVal * 12);
		}
	}
	tenureSlider.addEventListener('input', e => updateTenureDisplay(e.target.value, 'slider'));
	tenureInput.addEventListener('input', e => updateTenureDisplay(e.target.value, 'input'));
	toggleTenureUnit.addEventListener('click', function() {
		if (tenureUnit === 'months') {
			tenureUnit = 'years';
			tenureUnitLabel.textContent = '(years)';
			toggleTenureUnit.textContent = 'Switch to Months';
			let years = (parseInt(tenureInput.value) / 12).toFixed(2);
			tenureInput.value = years;
			tenureInput.min = 0.5;
			tenureInput.max = 30;
			tenureInput.step = 0.01;
		} else {
			tenureUnit = 'months';
			tenureUnitLabel.textContent = '(months)';
			toggleTenureUnit.textContent = 'Switch to Years';
			let months = Math.round(parseFloat(tenureInput.value) * 12);
			tenureInput.value = months;
			tenureInput.min = 6;
			tenureInput.max = 360;
			tenureInput.step = 1;
		}
		updateTenureDisplay(tenureInput.value, 'input');
	});
	updateTenureDisplay(tenureInput.value, 'input');

	// EMI calculation
	function calculateEMI() {
		const preEmiOnly = document.getElementById('preEmiOnly').checked;
		const P = parseFloat(principalInput.value.replace(/,/g, ''));
		const R = parseFloat(rateInput.value) / 12 / 100;
		let N;
		if (tenureUnitLabel.textContent.indexOf('year') !== -1) N = Math.round(parseFloat(tenureInput.value) * 12);
		else N = parseInt(tenureInput.value);
		const disbursalDate = new Date(document.getElementById('disbursalDate').value);
		const emiDate = new Date(document.getElementById('emiDate').value);
		if (P > 0 && R > 0 && N > 0) {
			const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
			let schedule = [];
			let totalInterest = 0;
			if (preEmiOnly) {
				let days = Math.round((emiDate - disbursalDate) / (1000 * 60 * 60 * 24));
				if (days < 0) days = 0;
				let preEmiInterest = P * (parseFloat(rateInput.value) / 100) * (days / 365);
				totalInterest += preEmiInterest;
				schedule.push({ month: 'Pre-EMI', emi: preEmiInterest, principalPaid: 0, interestPaid: preEmiInterest, balance: P });
				let balance = P;
				let currentDate = new Date(emiDate);
				currentDate.setMonth(currentDate.getMonth() + 1);
				for (let i = 1; i <= N; i++) {
					let interest = balance * R;
					let principalPaid = emi - interest;
					balance -= principalPaid;
					if (balance < 0) balance = 0;
					totalInterest += interest;
					schedule.push({ month: i, emi: emi, principalPaid: principalPaid, interestPaid: interest, balance: balance, emiDateOverride: new Date(currentDate) });
					currentDate.setMonth(currentDate.getMonth() + 1);
				}
				document.getElementById('emiResult').innerHTML = `Pre-EMI (First Installment, Broken Period Interest): <strong>₹${preEmiInterest.toFixed(2)}</strong><br>Monthly EMI (Subsequent): <strong>₹${emi.toFixed(2)}</strong>`;
			} else {
				let balance = P;
				let currentDate = new Date(emiDate);
				for (let i = 1; i <= N; i++) {
					let interest = balance * R;
					let principalPaid = emi - interest;
					balance -= principalPaid;
					if (balance < 0) balance = 0;
					totalInterest += interest;
					schedule.push({ month: i, emi: emi, principalPaid: principalPaid, interestPaid: interest, balance: balance });
					currentDate.setMonth(currentDate.getMonth() + 1);
				}
				document.getElementById('emiResult').innerHTML = `Monthly EMI: <strong>₹${emi.toFixed(2)}</strong>`;
			}
			const repaymentAmount = P + totalInterest;
			const tenureYears = (N / 12).toFixed(2);
			document.getElementById('emiSummary').innerHTML = `
				<div style="margin-bottom:10px;"><strong>Loan Amount:</strong> ₹${formatNumber(P)}</div>
				<div style="margin-bottom:10px;"><strong>Total Interest:</strong> ₹${formatNumber(totalInterest.toFixed(2))}</div>
				<div style="margin-bottom:10px;"><strong>Loan Repayment Amount:</strong> ₹${formatNumber(repaymentAmount.toFixed(2))}</div>
				<div style="margin-bottom:10px;"><strong>Monthly EMI:</strong> ₹${formatNumber(emi.toFixed(2))}</div>
				<div style="margin-bottom:10px;"><strong>Tenure:</strong> ${N} months (${tenureYears} years)</div>
			`;
			let years = {};
			schedule.forEach(function(row, idx) {
				let emiMonthDate;
				if (row.month === 'Pre-EMI') {
					emiMonthDate = new Date(disbursalDate);
					emiMonthDate.display = pad(disbursalDate.getDate()) + '-' + pad(disbursalDate.getMonth() + 1) + '-' + disbursalDate.getFullYear() + ' to ' + pad(emiDate.getDate()) + '-' + pad(emiDate.getMonth() + 1) + '-' + emiDate.getFullYear();
					let yearValue = emiDate.getFullYear();
					if (!years[yearValue]) years[yearValue] = [];
					years[yearValue].push(Object.assign({}, row, {emiMonthDate: emiMonthDate}));
				} else {
					if (row.emiDateOverride) emiMonthDate = new Date(row.emiDateOverride);
					else {
						emiMonthDate = new Date(emiDate);
						emiMonthDate.setMonth(emiMonthDate.getMonth() + (row.month - 1));
					}
					emiMonthDate.display = pad(emiMonthDate.getDate()) + '-' + pad(emiMonthDate.getMonth() + 1) + '-' + emiMonthDate.getFullYear();
					let yearValue = emiMonthDate.getFullYear();
					if (!years[yearValue]) years[yearValue] = [];
					years[yearValue].push(Object.assign({}, row, {emiMonthDate: emiMonthDate}));
				}
			});
			let table = `<h3 style='margin-top:32px;text-align:center'>EMI Payment Schedule</h3><div style='overflow-x:auto'>`;
			Object.keys(years).forEach(function(year) {
				table += `<div style='margin-bottom:18px;border:1px solid #b2dfdb;border-radius:8px;'>`;
				table += `<div style='background:#b2dfdb;color:#00695c;padding:10px 16px;cursor:pointer;font-weight:600;' onclick='document.getElementById("year-details-${year}").classList.toggle("hidden");'>Year ${year} <span style='float:right;'>[+/-]</span></div>`;
				table += `<div id='year-details-${year}' class='hidden' style='padding:0 8px 8px 8px;'>`;
				table += `<table style='width:100%;border-collapse:collapse;margin-top:8px;'><thead><tr><th>Month</th><th>EMI Date</th><th>EMI (₹)</th><th>Principal Paid (₹)</th><th>Interest Paid (₹)</th><th>Balance (₹)</th></tr></thead><tbody>`;
				years[year].forEach(function(row) {
					let emiDateStr = row.emiMonthDate.display || (pad(row.emiMonthDate.getDate()) + '-' + pad(row.emiMonthDate.getMonth() + 1) + '-' + row.emiMonthDate.getFullYear());
					table += `<tr><td>${row.month}</td><td>${emiDateStr}</td><td>${row.emi.toFixed(2)}</td><td>${row.principalPaid.toFixed(2)}</td><td>${row.interestPaid.toFixed(2)}</td><td>${row.balance.toFixed(2)}</td></tr>`;
				});
				table += `</tbody></table></div></div>`;
			});
			table += `</div>`;
			document.getElementById('emiSchedule').innerHTML = table;
			if (window.Chart) {
				let balanceLabels = schedule.map(function(row) {
					let emiMonthDate;
					if (row.emiDateOverride) emiMonthDate = new Date(row.emiDateOverride);
					else {
						emiMonthDate = new Date(document.getElementById('emiDate').value);
						emiMonthDate.setMonth(emiMonthDate.getMonth() + (row.month - 1));
					}
					return pad(emiMonthDate.getDate()) + '-' + pad(emiMonthDate.getMonth() + 1) + '-' + emiMonthDate.getFullYear();
				});
				let balanceData = schedule.map(function(row) { return row.balance; });
				let interestData = schedule.map(function(row) { return row.interestPaid; });
				let principalPaidData = schedule.map(function(row) { return row.principalPaid; });
				let balanceGraphContainer = document.getElementById('emiBalanceGraphContainer');
				balanceGraphContainer.style.display = 'block';
				let balanceCtx = document.getElementById('emiBalanceGraph').getContext('2d');
				if (window.emiBalanceChart && typeof window.emiBalanceChart.destroy === 'function') window.emiBalanceChart.destroy();
				window.emiBalanceChart = new Chart(balanceCtx, {
					type: 'line',
					data: {
						labels: balanceLabels,
						datasets: [
							{ label: 'Interest Paid (₹)', data: interestData, borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.08)', fill: false, pointRadius: 2, tension: 0.2 },
							{ label: 'Principal Paid (₹)', data: principalPaidData, borderColor: '#0078d7', backgroundColor: 'rgba(67,160,71,0.08)', fill: false, pointRadius: 2, tension: 0.2 }
						]
					},
					options: {
						plugins: {
							legend: { display: true, position: 'top' },
							tooltip: {
								enabled: true,
								mode: 'index',
								intersect: false,
								callbacks: {
									label: function(context) {
										let label = context.dataset.label || '';
										let value = context.parsed.y;
										return `${label}: ₹${value.toFixed(2)}`;
									}
								}
							}
						},
						responsive: true,
						scales: {
							x: { title: { display: true, text: 'EMI Date' } },
							y: { title: { display: true, text: 'Amount (₹)' }, beginAtZero: true }
						}
					}
				});
				let ctx = document.getElementById('emiChart').getContext('2d');
				if (window.emiChart && typeof window.emiChart.destroy === 'function') window.emiChart.destroy();
				window.emiChart = new Chart(ctx, {
					type: 'doughnut',
					data: {
						labels: ['Principal', 'Total Interest'],
						datasets: [{ data: [P, totalInterest], backgroundColor: ['#0078d7', '#ff9800'] }]
					},
					options: {
						plugins: { legend: { position: 'bottom' } },
						responsive: true
					}
				});
			}
		} else {
			document.getElementById('emiResult').innerHTML = 'Please enter valid values.';
			document.getElementById('emiSummary').innerHTML = '';
			document.getElementById('emiSchedule').innerHTML = '';
			if (window.emiChart && typeof window.emiChart.destroy === 'function') window.emiChart.destroy();
		}
	}

	[principalInput, principalSlider, rateInput, rateSlider, tenureInput, tenureSlider,
	 document.getElementById('preEmiOnly'), document.getElementById('disbursalDate'), document.getElementById('emiDate')]
		.forEach(function(el) { el.addEventListener('input', calculateEMI); });

	function runInitialCalculationWhenReady() {
		if (window.Chart) calculateEMI();
		else {
			var chartInterval = setInterval(function() {
				if (window.Chart) {
					clearInterval(chartInterval);
					calculateEMI();
				}
			}, 100);
		}
	}
	runInitialCalculationWhenReady();
});
