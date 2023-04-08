let courses = [];
let departments = [];
let campuses = [];
let numbers = [];
let levels = [];
let metadata = [];
let lastFormType = null;

const customMetadataObserver = new MutationObserver(function(mutations_list) {
	mutations_list.forEach(function(mutation) {
		for(added_node of mutation.addedNodes) {
			if(added_node.nodeType != 1)
				continue;
			if(added_node.nodeName != 'H2' || !added_node.classList.contains('s-lib-box-title'))
				continue;
			if(added_node.innerText.trim() == 'Custom Metadata') {
				added_node.closest('div[id^="s-lg-box-wrapper"]').style.display = 'none';
				for(li of document.querySelectorAll('.nav-stacked li.active ul.list-group li')) {
					if(li.innerText.trim() == 'Custom Metadata')
						li.style.display = 'none';
				}
				customMetadataObserver.disconnect();	
			}
		}
	});
});
customMetadataObserver.observe(document.body, { subtree: true, childList: true });

window.addEventListener('load', function(event) {
	if(document.location.href.indexOf('admin_c.php') != -1)
		return;
	
	if(!document.getElementById('textbookForms-container'))
		return;
	
	// LOAD CURSE INFORMATION 
	let customMetadata = false;
	let re = /^([A-Za-z]+) ([0-9]+[A-Z]{0,2})( \([A-Z]+\))?:/
	let h2 = document.querySelectorAll('#s-lg-col-1 h2.s-lib-box-title');
	for(h of h2) {
		// handle specific cases of non-courses
		if(h.innerText.trim() == 'Filter Courses')
			continue;
		if(h.innerText.trim() == 'Custom Metadata') {
			customMetadata = true;
			
			// create metadata stores
			for(h3 of h.parentElement.querySelectorAll('h3')) {
				let m = {};
				m.label = h3.innerText.trim();
				m.options = {};
				for(ul of h3.parentElement.querySelectorAll('h4 + ul')) {
					if(!ul.previousElementSibling || ul.previousElementSibling.nodeName != 'H4') {
						continue;
					}
					let h4 = ul.previousElementSibling.innerText.trim();
					let courses = [];
					for(li of ul.querySelectorAll('li')) {
						courses.push(li.innerText.trim());
					}
					m.options[h4] = courses;
				}
				metadata.push(m)
			}
			
			continue;
		}
		
		// might be at a course
		let c = {};
		c.full = h.innerText.trim();
		let matches = c.full.match(re);
		if(matches == null)
			continue;
		
		// definitely at a course
		c.department = matches[1];			
		c.number = matches[2];
		c.level = 100 * Math.floor(parseInt(c.number) / 100);
		
		c.campus = matches[3];
		if(matches[3]) 
			c.campus = c.campus.trim().replace('(','').replace(')','');
		
		c.name = c.full.substring(c.full.indexOf(': ') + 2);
		c.box = h.parentNode.parentNode.parentNode;
		courses.push(c);
		
		if(departments.indexOf(c.department) == -1)
			departments.push(c.department);
		
		if(numbers.indexOf(c.number) == -1)
			numbers.push(c.number);
		
		if(typeof c.campus != 'undefined' && campuses.indexOf(c.campus) == -1)
			campuses.push(c.campus);
		
		if(levels.indexOf(c.level) == -1)
			levels.push(c.level);
	}
	campuses = campuses.sort();
	numbers = numbers.sort();
	departments = departments.sort();
	levels = levels.sort();
	
	// CREATE FILTER FORM
	let form = document.getElementById('filterForm-fields');
	// campuses
	let campusHtml = htmlToElement('<div><label for="campus_select">Campus:</label><select id="campus_select"><option value="" selected>All</option></<select></div>');
	for(c of campuses) {
		if(typeof c == 'undefined')
			continue;
		let opt = document.createElement('OPTION');
		opt.setAttribute('value', c);
		opt.innerText = c;
		campusHtml.querySelector('select').append(opt);
	}
	if(campuses.length == 0) {
		campusHtml.style.display = 'none'; 
	}
	
	// departments
	let deptHtml = htmlToElement('<div><label for="dept_select">Department:</label><select id="dept_select"><option value="" selected>All</option></<select></div>');
	for(d of departments) {
		let opt = document.createElement('OPTION');
		opt.setAttribute('value', d);
		opt.innerText = d;
		deptHtml.querySelector('select').append(opt);
	}
	if(departments.length == 1) {
		deptHtml.style.display = 'none'; 
	}

	// course level
	let levelHtml = htmlToElement('<div><label for="level_select">Course Level:</label><select id="level_select"><option value="" selected>All</option></<select></div>');
	for(c of levels) {
		let opt = document.createElement('OPTION');
		if(c == 0) {
			opt.setAttribute('value', '0');
			opt.innerText = '000s';
		}
		else {
			opt.setAttribute('value', c);
			opt.innerText = c + 's';
		}
		levelHtml.querySelector('select').append(opt);
	}
	if(levels.length == 1) {
		levelHtml.style.display = 'none'; 
	}
	
	// custom metadata inputs 
	let metadataHtml = [];
	if(customMetadata) {
		for(meta of metadata) {
			let metaHtml = htmlToElement('<div><label for=""></label><select id=""><option value="" selected>All</option></<select></div>');		
			let id = meta.label;
			let id_short = id.match(/[A-Za-z0-9]+/);
			metaHtml.querySelector('label').innerText = id + ':';
			metaHtml.querySelector('label').setAttribute('for', id_short + '_select');
			metaHtml.querySelector('select').setAttribute('id', id_short + '_select');
			metaHtml.querySelector('select').setAttribute('data-meta', id);
			for(opt in meta.options) {
				let optHtml = document.createElement('OPTION');
				optHtml.innerText = opt
				optHtml.setAttribute('value', opt);
				metaHtml.querySelector('select').append(optHtml);
			}
			
			metadataHtml.push(metaHtml);
		}
	}
	
	// contains filter
	let textHtml = htmlToElement('<div><label for="text_filter">Contains:</label><input type="text" id="text_filter" value=""></div>');
	
	form.appendChild(campusHtml);
	form.appendChild(deptHtml);
	form.appendChild(levelHtml);
	
	for(m of metadataHtml) 
		form.appendChild(m);
	
	form.appendChild(textHtml);
	

	// CREATE SELECT FORM
	form = document.querySelector('#selectForm fieldset #tab-course-list');
	for(c of courses) {
		let label = htmlToElement('<div><label><input type="checkbox" checked><span></span></div>');
		label.querySelector('span').innerText = c.full;
		label.querySelector('input').id = 'checkbox-' + c.box.id;
		c.checkbox = label.querySelector('input');
		form.appendChild(label);
	}

	// CHECK FOR SAVED SETTINGS
	let saveKey = generateSaveKey();
	if(localStorage.getItem(saveKey)) {
		document.getElementById('saveCourses-container').classList.add('clear', 'loadable');
		changeSaveButton('saved');
		loadSavedSettings(saveKey);
	}
	else {
		// update display count on page load
		updateDisplayCounts(courses.length, 0);	
	}
	// show the forms
	document.getElementById('textbookForms-container').removeAttribute('style');

	// submit event listeners
	document.getElementById('filterForm').addEventListener('submit', function(evt) {
		evt.preventDefault();
		lastFormType = 'filter';
		filterCourses();
		changeSaveButton('save');
		updateLoadStatus();
	});
	document.getElementById('selectForm').addEventListener('submit', function(evt) {
		evt.preventDefault();
		lastFormType = 'select';
		selectCourses();
		changeSaveButton('save');
		updateLoadStatus();
	});
	
	// select/deselect listeners
	document.getElementById('all_courses').addEventListener('click', function(evt) {
		let boxes = document.querySelectorAll('#tab-course-list input[type="checkbox"]');
		for(b of boxes) {
			b.checked = true;
		}
	});
	document.getElementById('clear_courses').addEventListener('click', function(evt) {
		let boxes = document.querySelectorAll('#tab-course-list input[type="checkbox"]');
		for(b of boxes) {
			b.checked = false;
		}
	});
	
	// save event listener
	document.getElementById('saveCourses').addEventListener('click', function(evt) {
		let b = document.getElementById('saveCourses');
		let bText = b.querySelector('span.status');
		let status = document.getElementById('saveCourses-status');
		if(b.classList.contains('save')) {
			changeSaveButton('saving');
			status.innerText = b.getAttribute('data-saving-msg');

			setTimeout(function() {
				try {
					saveFormSettings();
				}
				catch(error) {
					console.log(error);
					return;
				}
				
				changeSaveButton('saved');
				status.innerText = b.getAttribute('data-saved-msg');
				document.getElementById('saveCourses-container').classList.add('clear', 'loadable');
				document.getElementById('saveCourses-container').classList.remove('load');

				setTimeout(clearSaveStatus, 5000);

			}, 500 + Math.floor(Math.random() * 500));

		}
	});
	
	document.getElementById('restoreSave').addEventListener('click', function(evt) {
		// notify loading
		document.getElementById('saveCourses-status').innerText = 'Loading saved courses';
		setTimeout(clearSaveStatus, 5000);		
		
		// load the save
		loadSavedSettings(generateSaveKey());
		
		// update buttons
		document.getElementById('saveCourses-container').setAttribute('class', '');
		document.getElementById('saveCourses-container').classList.add('clear', 'loadable');
		changeSaveButton('saved');
		
		// move focus
		document.getElementById('saveCourses').focus();
	});
	
	document.getElementById('deleteSave').addEventListener('click', function(evt) {
		let saveKey = generateSaveKey();
		let status = document.getElementById('saveCourses-status');
		if(localStorage.getItem(saveKey)) {
			// remove save
			localStorage.removeItem(saveKey);
			
			// provide status update to screen readers
			document.getElementById('saveCourses-status').innerText = 'Saved Courses Cleared';
			setTimeout(clearSaveStatus, 5000);

			// remove the clear save and reload save buttons from view
			document.getElementById('saveCourses-container').setAttribute('class', '');
			
			// update save button to save status
			changeSaveButton('save');	

			// move focus to the save button
			document.getElementById('saveCourses').focus();
		}
	});

	customMetadataObserver.disconnect();	
});

function updateLoadStatus() {
	let div = document.getElementById('saveCourses-container');
	if(div.classList.contains('loadable'))
		div.classList.add('load');
}

function clearSaveStatus() {
	let status = document.getElementById('saveCourses-status');	
	status.innerText = '';
}

function changeSaveButton(status) {
	let allowed = ['save', 'saving', 'saved'];
	if(!allowed.includes(status))
		return;
	
	let saveBtn = document.getElementById('saveCourses');
	saveBtn.setAttribute('class', '');
	saveBtn.classList.add(status);
	saveBtn.querySelector('.status').innerText = saveBtn.getAttribute('data-' + status + '-msg');
}

function updateDisplayCounts(visibility_count, hidden_count) {
	if(visibility_count == 1)
		document.getElementById('textbook_display_results').innerText = 'Showing 1 course (' + hidden_count + ' hidden)';
	else
		document.getElementById('textbook_display_results').innerText = 'Showing ' + visibility_count + ' courses (' + hidden_count + ' hidden)';
}

function filterCourses() {
	let i, visibility;
	let visibility_count = 0;
	let hidden_count = 0;
	for(i=0; i<courses.length; i++) {
		visibility = true;
		let c = courses[i];
	
		// campus 
		val = document.getElementById('campus_select').value;
		if(val != '' && val != c.campus)
			visibility = false;
		
		// department
		val = document.getElementById('dept_select').value;
		if(val != '' && val != c.department)
			visibility = false;
		
		// level 
		val = document.getElementById('level_select').value;
		if(val != '' && val != ('' + c.level))
			visibility = false;
		
		// metadata
		for(meta of metadata) {
			val = document.querySelector('[data-meta="' + meta.label + '"]').value;
			if(val != '' && !meta.options[val].includes(c.full)) {
				visibility = false;
			}
		}
		
		// contains
		val = document.getElementById('text_filter').value.trim().toLowerCase();
		if(val != '' && !c.full.toLowerCase().includes(val))
			visibility = false;
		
		if(visibility) {
			c.box.classList.remove('filter_textbooks_hidden');
			c.checkbox.checked = true;
			visibility_count += 1;
		}
		else {
			c.box.classList.add('filter_textbooks_hidden');
			c.checkbox.checked = false;
			hidden_count += 1;
		}
	}

	// update display count
	updateDisplayCounts(visibility_count, hidden_count);
}

function selectCourses() {
	let visibility_count = 0;
	let hidden_count = 0;
	
	for(c of courses) {
		if(c.checkbox.checked) {
			c.box.classList.remove('filter_textbooks_hidden');
			visibility_count += 1;
		}
		else {
			c.box.classList.add('filter_textbooks_hidden');
			hidden_count += 1;
		}
	}
	
	// update display count
	updateDisplayCounts(visibility_count, hidden_count);
}

function generateSaveKey() {
	return 'PCOM Textbooks ' + document.querySelector('#s-lg-guide-tabs a.active').innerText.trim();
}

function saveFormSettings() {
	let saveKey = generateSaveKey();
	let saveInfo = {};

	if(lastFormType == null || lastFormType == 'filter') {
		saveInfo.saveType = 'filter';
		saveInfo.inputs = [];
		let inputs = document.getElementById('filterForm').querySelectorAll('select,input[type="text"]');
		for(e of inputs) {
			saveInfo.inputs.push({'id': e.id, 'value': e.value});
		}
	}
	else if(lastFormType == 'select') {
		saveInfo.saveType = 'select';
		saveInfo.checkboxes = [];
		for(c of courses) {
			saveInfo.checkboxes.push({'course': c.full, 'checkbox': c.checkbox.id, 'checked': c.checkbox.checked})
		}
		localStorage.setItem(saveKey, JSON.stringify(saveInfo));
	}
	localStorage.setItem(saveKey, JSON.stringify(saveInfo));
}

function loadSavedSettings(saveKey) {
	let json = JSON.parse(localStorage.getItem(saveKey));
	if(json.saveType == 'filter') {
		for(input of json.inputs) {
			let e = document.getElementById(input.id);
			if(e != null) {
				e.value = input.value;
				if(e.nodeName == 'SELECT' && e.value == '')
					e.value = ''; // reset select in case option no longer exists
			}
		}
		filterCourses();
		document.getElementById('textbookFilterForm-filter').click();
	}
	else if(json.saveType == 'select') {
		for(cb of json.checkboxes) { 
			let checkbox = document.getElementById(cb.checkbox);
			let span = checkbox.nextElementSibling;
			if(span.innerText ==  cb.course )
				checkbox.checked = cb.checked;
		}
		selectCourses();
		document.getElementById('textbookFilterForm-select').click();
	}
}