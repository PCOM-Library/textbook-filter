let courses = [];
window.addEventListener('load', function(event) {
	if(document.location.href.indexOf('admin_c.php') != -1)
		return;
	let h2 = document.querySelectorAll('h2.s-lib-box-title');
	
	for(h of h2) {
		if(h.innerText.trim().startsWith(PROGRAM)) {
			let c = {};
			c.name = h.innerText.trim();
			c.number = c.name.substring(PROGRAM.length + 1, c.name.indexOf(':'));
			c.year = c.number.substring(0,1);
			c.box = h.parentNode.parentNode.parentNode;
			courses.push(c);
		}
	}
	
	document.getElementById('filter_results').addEventListener('click', function(evt) {
		filter_year = document.getElementById('filter_year').value;
		console.log(filter_year);
		if(filter_year == "all") {
			for(c of courses) {
				c.box.classList.remove('filter_textbooks_hidden');
			}			
		}
		else {
			for(c of courses) {
				if(c.year != filter_year)
					c.box.classList.add('filter_textbooks_hidden');
				else
					c.box.classList.remove('filter_textbooks_hidden');
			}				
		}

	});
	
});