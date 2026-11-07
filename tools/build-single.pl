#!/usr/bin/env perl
# Собирает все экраны прототипа в один файл mebelpro.html.
# Запуск из корня проекта:  perl tools/build-single.pl
use strict;
use warnings;
use utf8;
use open qw(:std :encoding(UTF-8));

my @pages = qw(index auth pricing dashboard projects studio cutting soon);

sub slurp {
  my ($f) = @_;
  open(my $fh, '<:encoding(UTF-8)', $f) or die "Не открыть $f: $!";
  local $/;
  my $s = <$fh>;
  close $fh;
  $s =~ s/\r\n/\n/g;
  return $s;
}

sub inline_js {
  my ($f) = @_;
  my $s = slurp($f);
  die "$f содержит </script> — встраивание сломает файл\n" if $s =~ m{</script}i;
  return $s;
}

my ($templates, $codes) = ('', '');
for my $p (@pages) {
  my $html = slurp("$p.html");
  my ($title) = $html =~ m{<title>(.*?)</title>}s;
  my ($shell) = $html =~ m{<body[^>]*data-shell="([^"]*)"};
  my ($active) = $html =~ m{<body[^>]*data-active="([^"]*)"};
  my ($main) = $html =~ m{(<main id="page".*?</main>)}s or die "В $p.html нет <main id=\"page\">\n";
  my ($code) = $html =~ m{</main>\s*(?:<div id="print-area"></div>\s*)?<script>(.*?)</script>}s;
  die "В $p.html нет скрипта страницы\n" unless defined $code;
  $active //= '';
  $templates .= qq{<template data-page="$p" data-shell="$shell" data-active="$active" data-title="$title">\n$main\n</template>\n};
  $codes .= qq{<script type="text/x-page" data-for="$p">$code</script>\n};
}

my $css = slurp('assets/app.css');
my $out = <<"HTML";
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MebelPro KG</title>
<!-- Сгенерировано tools/build-single.pl из многофайловой версии. Правьте исходники и пересоберите. -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD\@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght\@300..800&family=JetBrains+Mono:wght\@400..700&family=Space+Grotesk:wght\@400..700&family=Onest:wght\@400..800&display=swap" rel="stylesheet">
<style>
$css</style>
<style id="page-size"></style>
<script src="https://cdn.tailwindcss.com"></script>
<script>
@{[ inline_js('assets/tailwind-config.js') ]}</script>
<script>window.MP_SINGLE = true;</script>
<script>
@{[ inline_js('assets/data.js') ]}</script>
<script>
@{[ inline_js('assets/layout.js') ]}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
@{[ inline_js('assets/scene3d.js') ]}</script>
</head>
<body class="bg-surface font-body-md text-on-surface antialiased">
$templates$codes<div id="print-area"></div>
<script>
(function () {
  var r = MP.route();
  var t = document.querySelector('template[data-page="' + r.page + '"]') || document.querySelector('template[data-page="index"]');
  var page = t.getAttribute('data-page');
  document.body.dataset.shell = t.getAttribute('data-shell');
  document.body.dataset.active = t.getAttribute('data-active');
  if (page === 'soon') {
    var s = MP.query().get('s') || '';
    document.body.dataset.active = s;
    if (s === 'admin') document.body.dataset.shell = 'public';
  }
  document.title = t.getAttribute('data-title');
  document.body.insertBefore(t.content.cloneNode(true), document.getElementById('print-area'));
  var code = document.querySelector('script[data-for="' + page + '"]');
  if (code) { var el = document.createElement('script'); el.textContent = code.textContent; document.body.appendChild(el); }
})();
</script>
</body>
</html>
HTML

open(my $fh, '>:encoding(UTF-8)', 'mebelpro.html') or die $!;
print $fh $out;
close $fh;
printf "mebelpro.html: %d экранов, %.0f КБ\n", scalar(@pages), (-s 'mebelpro.html') / 1024;
