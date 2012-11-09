define(['jquery',
		'text!./templates/hello_text.html'],
	function($, tpl_hello_text){

	return {
		init:function(){
			console.log('helloapp init');
			console.log('tpl_hello_text', tpl_hello_text);
			$('body').append(tpl_hello_text);
		}
	};

});