
(function(){
	
	var html = '';
	/*
	html += '<a class="diy export" data-type="json">导出json</a>',
	html += '<a class="diy export" data-type="md">导出md</a>',
	html += '<a class="diy export" data-type="svg">导出svg</a>',
	html += '<a class="diy export" data-type="png">导出png</a>',*/
	html += '<a class="diy export" name="btn_export_km" data-type="km">导出km</a>',
	html += '<button class="diy input">',
	html += '导入<input type="file" id="fileInput">',
	html += '</button>';

	$('.editor-title').append(html);

	$('.diy').css({
		// 'height': '30px',
		// 'line-height': '30px',
		'margin-top': '0px',
		'float': 'right',
		'background-color': '#fff',
		'min-width': '60px',
		'text-decoration': 'none',
		color: '#999',
		'padding': '0 10px',
		border: 'none',
		'border-right': '1px solid #ccc',
	});
	$('.input').css({
		'overflow': 'hidden',
		'position': 'relative',
	}).find('input').css({
		cursor: 'pointer',
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		display: 'inline-block',
		opacity: 0
	});
	
	$('.export').css('cursor','not-allowed');

	/*
	$(document).on('mouseover', '.export', function(event) {
		// 链接在hover的时候生成对应数据到链接中
		event.preventDefault();
		var $this = $(this),
				type = $this.data('type'),
				exportType;
		switch(type){
			case 'km':
				exportType = 'json';
				break;
			case 'md':
				exportType = 'markdown';
				break;
			default:
				exportType = type;
				break;
		}

		editor.minder.exportData(exportType).then(function(content){
			var blob = new Blob([content]);
			switch(exportType){
				case 'json':
					console.log($.parseJSON(content));
					break;
				case 'png':
					var arr = content.split(','), mime = arr[0].match(/:(.*?);/)[1],
					  bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
					while (n--) {
					  u8arr[n] = bstr.charCodeAt(n);
					}
					blob = new Blob([u8arr], {type: mime});
					break;
				default:
					console.log(content);
					break;
			}
			$this.css('cursor', 'pointer');
			var url = URL.createObjectURL(blob);
			var aLink = $this[0];
			aLink.href = url;
			aLink.download = $('#node_text1').text()+'.'+type;
		});
	}).on('mouseout', '.export', function(event) {
		// 鼠标移开是设置禁止点击状态，下次鼠标移入时需重新计算需要生成的文件
		event.preventDefault();
		// $(this).css('cursor', 'not-allowed');
	}).on('click', '.export', function(event) {
		// 禁止点击状态下取消跳转
		var $this = $(this);
		if($this.css('cursor') == 'not-allowed'){
			event.preventDefault();
		}
	});
	*/
	function get_datatime_by_yyyyMMddhhmmss_without_split() {
		let d = new Date();
		return d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString() + d.getHours().toString() + d.getMinutes().toString() + d.getSeconds().toString();
	}

    function save_file(filename, content) {
        let element = document.createElement('a');
		filename = filename + '.km';
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

	// 导入
	window.onload = function() {
		// 导出事件
		$("[name='btn_export_km']").on("click", function(){
			let c = window.parent.document.getElementById('mindmap_diagram_json').value;
			save_file(get_datatime_by_yyyyMMddhhmmss_without_split(), c);
		});

		// 初始化时候，先import父框架的json数据
		// 在iframe子页面中查找父页面元素
		let parent = window.parent.document.getElementById('mindmap_diagram_json');
		// alert(parent.value);
		let maintopic = _lang_pack[_lang_default]['maintopic'];
		let data_json = '{"root":{"data":{"id":"cmhllt94xb40","created":1661683403686,"text":"' + maintopic + '"},"children":[]},"template":"default","theme":"fresh-blue","version":"1.4.33"}';
		if(parent.value != ""){
			data_json = parent.value;
		}

		editor.minder.importData('json', data_json).then(function(data){
			console.log(data)
			// $(fileInput).val('');
		});
		// == 初始化结束 == 

		$('.export').css('cursor','default');
		var fileInput = document.getElementById('fileInput');

		// 导入部分的逻辑，支持导入md km json文件
		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0],
					// textType = /(md|km)/,
					fileType = file.name.substr(file.name.lastIndexOf('.')+1);
			console.log(file);
			switch(fileType){
				case 'md':
					fileType = 'markdown';
					break;
				case 'km':
				case 'json':
					fileType = 'json';
					break;
				default:
					console.log("File not supported!");
					alert('只支持.km、.md、.json文件');
					return;
			}
			var reader = new FileReader();
			reader.onload = function(e) {
				var content = reader.result;
				editor.minder.importData(fileType, content).then(function(data){
					console.log(data)
					$(fileInput).val('');
				});
			}
			reader.readAsText(file);
		});

		// 定时将最新数据转导到父框架上的input
		setInterval(function(){
			editor.minder.exportData('json').then(function(content){
				window.parent.document.getElementById('mindmap_diagram_json').value = content;
			});
			editor.minder.exportData('png').then(function(content){
				window.parent.document.getElementById('mindmap_diagram_png').value = content;
			});
		}, 500);

		// 加入鼠标滚动放大缩小脚本
		$(".minder-editor").on('mousewheel DOMMouseScroll', function(event) {
			if(event.ctrlKey == true)
			{
				event.preventDefault();
				if(event.originalEvent.wheelDelta > 0) {
					 console.log('Down');
					 editor.minder.execCommand('zoomIn');
				 }else {
					 console.log('Up');
					 editor.minder.execCommand('zoomOut');
				 }
			}
		});
		
	}


})();
