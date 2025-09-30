// emi-calculator.js - rewritten from car-loan.html

function pad(n) { return n < 10 ? '0' + n : n; }
// formatNumber: accepts a number or numeric string and optional decimals.
// If decimals is provided, format with that many fraction digits (useful for currency).
function formatNumber(num, decimals) {
	let n = Number(num);
	if (isNaN(n)) n = 0;
	if (typeof decimals === 'number') {
		return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
	}
	// default: no forced decimals, return localized string (will include decimals if present)
	return n.toLocaleString('en-IN');
}
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
		// accept either raw numeric input or formatted value with commas
		let raw = String(val).replace(/[^\d]/g, '');
		if (!raw) raw = '0';
		let numVal = Number(raw);
		// store raw numeric value on the input for calculations
		principalInput.dataset.raw = String(numVal);
		principalSlider.value = numVal;
		// display formatted value with Indian commas in the text input
		principalInput.value = formatNumber(numVal);
	if (principalWords) principalWords.textContent = numberToWords(numVal);
	}
	principalSlider.addEventListener('input', e => updatePrincipalDisplay(e.target.value));
	// format on each keystroke while preserving caret position
	principalInput.addEventListener('input', function(e) {
		try {
			const el = e.target;
			const selStart = el.selectionStart || 0;
			// count digits before caret
			const digitsBefore = el.value.slice(0, selStart).replace(/\D/g, '').length;
			// raw numeric value
			const raw = el.value.replace(/[^\d]/g, '') || '0';
			principalInput.dataset.raw = raw;
			principalSlider.value = raw;
			if (principalWords) principalWords.textContent = numberToWords(Number(raw));
			// formatted value
			const formatted = formatNumber(Number(raw));
			el.value = formatted;
			// compute new caret position: find position after digitsBefore digits
			let pos = 0, digitCount = 0;
			while (digitCount < digitsBefore && pos < el.value.length) {
				if (/\d/.test(el.value.charAt(pos))) digitCount++;
				pos++;
			}
			el.setSelectionRange(pos, pos);
		} catch (err) {
			// fallback: simple update
			const raw = e.target.value.replace(/[^\d]/g, '') || '0';
			principalInput.dataset.raw = raw;
			principalSlider.value = raw;
			if (principalWords) principalWords.textContent = numberToWords(Number(raw));
			principalInput.value = formatNumber(Number(raw));
		}
		// update calculation live
		calculateEMI();
	});
	// initial format: principal will be set later as part of the combined defaults

	// Rate sync
	const rateSlider = document.getElementById('rateSlider');
	const rateInput = document.getElementById('rate');
	// Accept partial numeric input while typing (e.g. "7.", "7.4") without
	// overwriting the field. Only update the slider when the input contains a
	// parseable numeric value. Normalize / clamp the value on blur.
	function updateRateDisplay(val, source) {
		if (source === 'slider') {
			// slider always produces a valid numeric string
			let floatVal = parseFloat(val);
			if (isNaN(floatVal)) floatVal = 0;
			floatVal = Math.max( Number(rateSlider.min || 1), Math.min(Number(rateSlider.max || 20), floatVal));
			// reflect slider value into the number input
			rateInput.value = floatVal;
			rateSlider.value = floatVal;
			try { updateRangeFill(rateSlider); } catch (e) { /* ignore if not ready */ }
			return;
		}
		// source === 'input'
		const str = String(val);
		// allow empty or partial numeric patterns: digits, optional single dot
		const partialNumPattern = /^-?\d*(?:\.\d*)?$/;
		if (str === '' || partialNumPattern.test(str)) {
			// if parseable to a number, update slider; otherwise leave input untouched
			const parsed = parseFloat(str);
			if (!isNaN(parsed)) {
				const floatVal = Math.max(Number(rateSlider.min || 1), Math.min(Number(rateSlider.max || 20), parsed));
				rateSlider.value = floatVal;
				try { updateRangeFill(rateSlider); } catch (e) { /* ignore if not ready */ }
			}
			// do not overwrite rateInput.value here so the user can continue typing
			return;
		}
		// fallback: if the input contains invalid characters, coerce to a clamped number
		let floatVal = parseFloat(str);
		if (isNaN(floatVal)) floatVal = Number(rateSlider.min || 1);
		floatVal = Math.max(Number(rateSlider.min || 1), Math.min(Number(rateSlider.max || 20), floatVal));
		rateInput.value = floatVal;
		rateSlider.value = floatVal;
		try { updateRangeFill(rateSlider); } catch (e) { /* ignore if not ready */ }
	}

	// slider -> input (immediate)
	rateSlider.addEventListener('input', e => {
		updateRateDisplay(e.target.value, 'slider');
		try { updateBubblePosition(rateSlider, rateBubble, formatRate); } catch (e) {}
	});

	// input -> slider (allow partial typing)
	rateInput.addEventListener('input', e => updateRateDisplay(e.target.value, 'input'));

	// on blur, normalize and clamp to allowed range and trigger visual updates
	rateInput.addEventListener('blur', function(e) {
		let parsed = parseFloat(rateInput.value);
		if (isNaN(parsed)) parsed = Number(rateSlider.min || 1);
		parsed = Math.max(Number(rateSlider.min || 1), Math.min(Number(rateSlider.max || 20), parsed));
		// display a clean numeric value (no trailing dot)
		rateInput.value = parseFloat(parsed.toFixed(2));
		rateSlider.value = parsed;
		try { updateRangeFill(rateSlider); updateBubblePosition(rateSlider, rateBubble, formatRate); } catch (e) {}
	});

	// initialize slider from current input value if parseable
	updateRateDisplay(rateInput.value, 'input');

	// Tenure sync
	const tenureSlider = document.getElementById('tenureSlider');
	const tenureInput = document.getElementById('tenure');
	const toggleTenureUnit = document.getElementById('toggleTenureUnit');
	const toggleTenureText = document.getElementById('toggleTenureText');
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
	// toggleTenureUnit is now a checkbox switch; update on change
	if (toggleTenureUnit) {
		toggleTenureUnit.addEventListener('change', function() {
			if (toggleTenureUnit.checked) {
				// switch to years
				tenureUnit = 'years';
				tenureUnitLabel.textContent = '(years)';
				// caption removed
				// convert current slider/months value to years (with 2 decimals)
				let monthsVal = parseFloat(tenureSlider.value) || parseFloat(tenureInput.value) || 0;
				let years = (monthsVal / 12);
				tenureInput.value = years.toFixed(0);
				tenureInput.min = 1;
				tenureInput.max = 30;
				tenureInput.step = 1;
			} else {
				// switch to months
				tenureUnit = 'months';
				tenureUnitLabel.textContent = '(months)';
				// caption removed
				let yearsVal = parseFloat(tenureInput.value) || (parseFloat(tenureSlider.value) / 12) || 0;
				let months = Math.round(yearsVal * 12);
				tenureInput.value = months;
				tenureInput.min = 6;
				tenureInput.max = 360;
				tenureInput.step = 1;
			}
			updateTenureDisplay(tenureInput.value, 'input');
		});
	}
	updateTenureDisplay(tenureInput.value, 'input');

	// Combined defaults: principal, annual rate and tenure based on page filename
	(function setDefaultsByLoanType(){
		const page = (window.location.pathname || '').split('/').pop();

		// Update the visible H2 title so the shared EMI UI reflects the specific loan page
		try {
			const emiTitleEl = document.querySelector('.emi-title');
			if (emiTitleEl) {
				const titleMapping = {
					'home-loan.html': 'Home Loan EMI Calculator',
					'personal-loan.html': 'Personal Loan EMI Calculator',
					'car-loan.html': 'Car Loan EMI Calculator',
					'two-wheeler-loan.html': 'Two Wheeler Loan EMI Calculator',
					'lap-loan.html': 'Loan Against Property (LAP) EMI Calculator',
					'emi-calculator.html': 'EMI Calculator'
				};
				emiTitleEl.textContent = titleMapping[page] || emiTitleEl.textContent || 'EMI Calculator';
			}
		} catch (e) { /* ignore if DOM not ready or selector missing */ }
		// default mappings (tweak as needed)
		const principalMapping = {
			'home-loan.html': 5000000,
			'personal-loan.html': 200000,
			'car-loan.html': 800000,
			'two-wheeler-loan.html': 70000,
			'lap-loan.html': 9400000,
			'emi-calculator.html': Number(principalInput.dataset.raw || principalInput.value || principalSlider.value) || 9400000
		};
		const rateMapping = {
			'home-loan.html': 7.10,
			'personal-loan.html': 13.50,
			'car-loan.html': 9.00,
			'two-wheeler-loan.html': 9.50,
			'lap-loan.html': 8.50,
			'emi-calculator.html': parseFloat(rateInput.value) || 7.45
		};
		const tenureMappingMonths = {
			'home-loan.html': 240,
			'personal-loan.html': 60,
			'car-loan.html': 60,
			'two-wheeler-loan.html': 36,
			'lap-loan.html': 240,
			'emi-calculator.html': parseInt(tenureSlider.value) || 240
		};

		// Apply principal
		let desiredPrincipal = principalMapping[page] !== undefined ? principalMapping[page] : Number(principalInput.dataset.raw || principalInput.value || principalSlider.value) || 9400000;
		const pMin = Number(principalSlider.min) || 10000;
		const pMax = Number(principalSlider.max) || 50000000;
		desiredPrincipal = Math.max(pMin, Math.min(pMax, Number(desiredPrincipal)));
		updatePrincipalDisplay(desiredPrincipal);

		// Apply rate
		let desiredRate = rateMapping[page] !== undefined ? rateMapping[page] : parseFloat(rateInput.value) || 7.45;
		desiredRate = Math.max(Number(rateSlider.min || 1), Math.min(Number(rateSlider.max || 20), Number(desiredRate)));
		updateRateDisplay(desiredRate, 'input');
		try { updateBubblePosition(rateSlider, rateBubble, formatRate); updateRangeFill(rateSlider); } catch (e) {}

		// Apply tenure (months)
		let desiredMonths = tenureMappingMonths[page] !== undefined ? tenureMappingMonths[page] : parseInt(tenureSlider.value) || 240;
		const tMin = Number(tenureSlider.min) || 6;
		const tMax = Number(tenureSlider.max) || 360;
		desiredMonths = Math.max(tMin, Math.min(tMax, Number(desiredMonths)));
		if (tenureUnit === 'months') {
			tenureSlider.value = desiredMonths;
			updateTenureDisplay(desiredMonths, 'slider');
			try { updateBubblePosition(tenureSlider, tenureBubble, formatTenure); updateRangeFill(tenureSlider); } catch (e) {}
		} else {
			let yearsVal = Math.round(desiredMonths / 12);
			tenureInput.value = yearsVal;
			updateTenureDisplay(yearsVal, 'input');
			try { updateBubblePosition(tenureSlider, tenureBubble, formatTenure); updateRangeFill(tenureSlider); } catch (e) {}
		}
	})();

	// --- Slider value bubbles ---
	function createBubble(slider) {
		const bubble = document.createElement('div');
		bubble.className = 'slider-bubble';
		slider.parentElement.appendChild(bubble);
		return bubble;
	}

	function updateBubblePosition(slider, bubble, formatFn) {
		const sliderRect = slider.getBoundingClientRect();
		const parentRect = slider.parentElement.getBoundingClientRect();
		const min = parseFloat(slider.min) || 0;
		const max = parseFloat(slider.max) || 100;
		const val = parseFloat(slider.value);
		const percent = (val - min) / (max - min);
		// compute x relative to parent but clamp within the slider's own track
		const sliderLeftRel = sliderRect.left - parentRect.left;
		let x = sliderLeftRel + percent * sliderRect.width;
		const padding = 8; // keep bubble inside a small padding from track edges
		const minX = sliderLeftRel + padding;
		const maxX = sliderLeftRel + sliderRect.width - padding;
		x = Math.max(minX, Math.min(x, maxX));
		bubble.style.left = x + 'px';
		bubble.textContent = formatFn ? formatFn(val) : slider.value;
	}

    // updateRangeFill: show filled portion of slider track up to thumb
    function updateRangeFill(slider) {
        const min = Number(slider.min) || 0;
        const max = Number(slider.max) || 100;
        const val = Number(slider.value);
        const pct = ((val - min) / (max - min)) * 100;
        // create a background that visually fills to the thumb position
        slider.style.background = `linear-gradient(90deg, var(--slider-end) ${pct}%, var(--slider-mid) ${pct}%, var(--slider-start) 100%)`;
    }

	// Create bubbles for principal, rate and tenure sliders
	const principalBubble = createBubble(principalSlider);
	const rateBubble = createBubble(rateSlider);
	const tenureBubble = createBubble(tenureSlider);

	// formatting helpers
	function formatPrincipal(v){ return '₹' + formatNumber(Math.round(v)); }
	function formatRate(v){ return parseFloat(v).toFixed(2) + '%'; }
	function formatTenure(v){ return tenureUnit === 'months' ? Math.round(v) + 'm' : parseFloat(v).toFixed(2) + 'y'; }

	// update on input and update filled track
	principalSlider.addEventListener('input', function(e){ updateBubblePosition(principalSlider, principalBubble, formatPrincipal); updateRangeFill(principalSlider); });
	rateSlider.addEventListener('input', function(e){ updateBubblePosition(rateSlider, rateBubble, formatRate); updateRangeFill(rateSlider); });
	tenureSlider.addEventListener('input', function(e){ updateBubblePosition(tenureSlider, tenureBubble, formatTenure); updateRangeFill(tenureSlider); });

	// initialize positions and filled track
	setTimeout(function(){
		updateBubblePosition(principalSlider, principalBubble, formatPrincipal);
		updateBubblePosition(rateSlider, rateBubble, formatRate);
		updateBubblePosition(tenureSlider, tenureBubble, formatTenure);
		updateRangeFill(principalSlider);
		updateRangeFill(rateSlider);
		updateRangeFill(tenureSlider);
	}, 100);

	// show bubble while dragging (for touch devices) using a 'dragging' class
	[principalSlider, rateSlider, tenureSlider].forEach(function(sl) {
		const parent = sl.parentElement;
		sl.addEventListener('pointerdown', function() { parent.classList.add('dragging'); });
		document.addEventListener('pointerup', function() { parent.classList.remove('dragging'); });
		// also remove on pointercancel to be safe
		sl.addEventListener('pointercancel', function() { parent.classList.remove('dragging'); });
	});

	// EMI calculation
	function calculateEMI() {
		const preEmiOnly = document.getElementById('preEmiOnly').checked;
		// robust principal parsing: prefer dataset.raw, otherwise strip non-digits from visible value
		let rawP = (principalInput.dataset.raw !== undefined && principalInput.dataset.raw !== '') ? principalInput.dataset.raw : principalInput.value || '0';
		rawP = String(rawP).replace(/[^\d.\-]/g, '');
		let P = parseFloat(rawP);
		if (isNaN(P)) P = 0;
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
			// build structured summary using summary-card classes
			document.getElementById('emiSummary').innerHTML = `
				<div class="summary-card emi">
					<div class="label">Monthly EMI</div>
					<div class="value amount">₹${formatNumber(emi, 2)}</div>
				</div>
				<div class="summary-card">
					<div class="label">Loan Amount</div>
					<div class="value amount">₹${formatNumber(P)}</div>
				</div>
				<div class="summary-card">
					<div class="label">Total Interest</div>
					<div class="value amount">₹${formatNumber(totalInterest, 2)}</div>
				</div>
				<div class="summary-card">
					<div class="label">Total Repayment</div>
					<div class="value amount">₹${formatNumber(repaymentAmount, 2)}</div>
				</div>
				<div class="summary-card">
					<div class="label">Tenure</div>
					<div class="value">${N} months<br><small class="summary-small">(${tenureYears} yrs)</small></div>
				</div>
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
			let table = `<h3 class='schedule-title'>EMI Payment Schedule</h3><div class='table-container'>`;
			Object.keys(years).forEach(function(year) {
				table += `<div class='year-block'>`;
				// create a simple header; we'll attach listeners after injecting HTML
				table += `<div class='year-header'>Year ${year} <span class='toggle-indicator'>[+/-]</span></div>`;
				table += `<div id='year-details-${year}' class='year-details hidden'>`;
				table += `<table class='schedule-table'><thead><tr><th>Month</th><th>EMI Date</th><th>EMI (₹)</th><th>Principal Paid (₹)</th><th>Interest Paid (₹)</th><th>Balance (₹)</th></tr></thead><tbody>`;
				years[year].forEach(function(row) {
					let emiDateStr = row.emiMonthDate.display || (pad(row.emiMonthDate.getDate()) + '-' + pad(row.emiMonthDate.getMonth() + 1) + '-' + row.emiMonthDate.getFullYear());
					table += `<tr>
						<td>${row.month}</td>
						<td>${emiDateStr}</td>
						<td class="numeric">₹${formatNumber(row.emi, 2)}</td>
						<td class="numeric">₹${formatNumber(row.principalPaid, 2)}</td>
						<td class="numeric">₹${formatNumber(row.interestPaid, 2)}</td>
						<td class="numeric">₹${formatNumber(row.balance, 2)}</td>
					</tr>`;
				});
				table += `</tbody></table></div></div>`;
			});
				table += `</div>`;
			document.getElementById('emiSchedule').innerHTML = table;
			// Attach click handlers to the generated year headers to toggle details
			document.querySelectorAll('#emiSchedule .year-header').forEach(function(hdr) {
				hdr.style.cursor = 'pointer';
				hdr.setAttribute('role', 'button');
				hdr.setAttribute('tabindex', '0');
				// start collapsed
				hdr.setAttribute('aria-expanded', 'false');
				hdr.addEventListener('click', function() {
					// Prefer the next sibling (year-details) if present, otherwise fallback to search
					let details = hdr.nextElementSibling;
					if (!details || !details.classList.contains('year-details')) {
						const block = hdr.parentElement;
						if (block) details = block.querySelector('.year-details');
						else details = null;
					}
					if (details) {
						const nowHidden = details.classList.toggle('hidden');
						hdr.setAttribute('aria-expanded', nowHidden ? 'false' : 'true');
					}
				});
				// keyboard accessibility: toggle on Enter/Space
				hdr.addEventListener('keydown', function(e) {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						hdr.click();
					}
				});
				// Delegated listener on the schedule container to handle clicks even if outer code
				// replaces the inner HTML later. This is a reliable fallback and keeps behavior
				// consistent when schedule is regenerated.
				const scheduleContainer = document.getElementById('emiSchedule');
				if (scheduleContainer && !scheduleContainer.__hasYearToggle) {
					scheduleContainer.__hasYearToggle = true;
					scheduleContainer.addEventListener('click', function(e) {
						const hdr = e.target.closest && e.target.closest('.year-header');
						if (!hdr) return;
						let details = hdr.nextElementSibling;
						if (!details || !details.classList.contains('year-details')) {
							const block = hdr.parentElement;
							details = block ? block.querySelector('.year-details') : null;
						}
						if (details) {
							const nowHidden = details.classList.toggle('hidden');
							hdr.setAttribute('aria-expanded', nowHidden ? 'false' : 'true');
						}
					});
				}
			});
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

	// debounce helper to limit calculateEMI calls during rapid input
	function debounce(fn, wait) {
		let t = null;
		return function() {
			const args = arguments;
			const ctx = this;
			clearTimeout(t);
			t = setTimeout(function() { fn.apply(ctx, args); }, wait);
		};
	}

	const calculateEMIDebounced = debounce(calculateEMI, 120);

	// Wire input listeners, but filter out any missing elements to avoid runtime errors
	[principalInput, principalSlider, rateInput, rateSlider, tenureInput, tenureSlider,
	 document.getElementById('preEmiOnly'), document.getElementById('disbursalDate'), document.getElementById('emiDate')]
		.filter(Boolean)
		.forEach(function(el) { el.addEventListener('input', calculateEMIDebounced); });

	// Delegated click handler for year header expand/collapse (avoid inline onclick)
	document.addEventListener('click', function(e) {
		const el = e.target.closest && e.target.closest('.year-header');
		if (el) {
			const parent = el.parentElement;
			const details = parent.querySelector('.year-details');
			if (details) details.classList.toggle('hidden');
		}
	});

	function runInitialCalculationWhenReady() {
		// Always run an initial calculation so the schedule/summary appear even if Chart.js
		// hasn't loaded yet. If Chart.js loads later, update charts again.
		calculateEMI();
		if (!window.Chart) {
			var chartInterval = setInterval(function() {
				if (window.Chart) {
					clearInterval(chartInterval);
					// re-run calculation so charts are drawn
					calculateEMI();
				}
			}, 100);
		}
	}
	runInitialCalculationWhenReady();
});
