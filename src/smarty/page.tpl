<!doctype html>
<html lang="en">
{assign var="TPLdata" value=$ad3.src_data.data.data.chs.edu_pic_ad3.data}
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
</head>
<body>
{foreach key=outer item=contact from=$TPLdata}
        <a href="{$contact.url}" target="_blank"><img src="{$contact.img}" alt="{$contact.title}"/>{$contact.title}</a>
{/foreach}
</body>
</html>
