<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8"/>
		<title>%%name%%</title>
		<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
	</head>
	<body style='padding:20px'>
		<div id='app'></div>
		<script src='./%%name%%-dev.js'></script>
		<script>
		var Component = Qute.vm("%%componentName%%");
		new Component().mount('app');
		</script>
	</body>
</html>
