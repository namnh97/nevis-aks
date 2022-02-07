(function() {
	function closeDropdown(event) {
		var dropdownMenu = $('.dropdown')
		.not(
			$('.dropdown').has($(event.target))
		).children('.dropdown-menu');
		
		dropdownMenu.hide();
		
		// remove event listener till we have a new dropdown menu open
		if (dropdownMenu.is(":hidden")) {
			$(document).off(event);
		}
	}

	$(".dropdown").on("click", function(e){
		// show / hide dropdown menu
		$(this).children('.dropdown-menu').toggle();
		
		//handle clicking away
		$(document).on("click", closeDropdown);
	});
}());
