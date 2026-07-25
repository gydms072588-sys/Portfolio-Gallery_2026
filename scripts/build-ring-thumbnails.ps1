Add-Type -AssemblyName System.Drawing

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$outputDirectory = Join-Path $root "assets\images\thumbnails\ring"
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$projects = @(
  @{ Id="banner-winter-sale"; Title="원플템 기간한정 특별세일 배너"; Category="BANNER"; Image="assets\images\projects\banner-winter-sale-list-20260716.jpg"; Accent="#255DAA" },
  @{ Id="banner-kbcard-event"; Title="국민카드 몰 행사 배너 운영 디자인"; Category="BANNER"; Image="assets\images\projects\banner-kbcard-event-list-20260716.jpg"; Accent="#E36744" },
  @{ Id="banner-ably-redesign"; Title="에이블리 리디자인 배너"; Category="BANNER"; Image="assets\images\projects\banner-ably-redesign-list-20260716.jpg"; Accent="#E96A96" },
  @{ Id="banner-univstore-event"; Title="유니브스토어 행사 배너 디자인"; Category="BANNER"; Image="assets\images\projects\banner-univstore-event-list-20260716.jpg"; Accent="#5A72B8" },
  @{ Id="banner-shopping-gift"; Title="쇼핑몰 사은품·행사 배너 운영 디자인"; Category="BANNER"; Image="assets\images\projects\banner-shopping-gift-list-20260716.jpg"; Accent="#C58C48" },
  @{ Id="banner-junosoft-commerce"; Title="주노소프트 커머스 배너 디자인"; Category="BANNER"; Image="assets\images\projects\banner-junosoft-commerce-list-20260716.jpg"; Accent="#4F8A76" },
  @{ Id="product-ably-blouse"; Title="에이블리 블라우스 상품 상세페이지"; Category="PRODUCT PAGE"; Image="assets\images\projects\product-ably-blouse.jpg"; Accent="#C98791" },
  @{ Id="product-enne-tube-heater"; Title="에네 튜브히터 상세페이지"; Category="PRODUCT PAGE"; Image="assets\images\projects\product-enne-tube-heater.jpg"; Accent="#D77D3B" },
  @{ Id="product-junosoft-shopping"; Title="주노소프트 쇼핑몰 상세페이지"; Category="PRODUCT PAGE"; Image="assets\images\projects\product-junosoft-shopping.jpg"; Accent="#758B5D" },
  @{ Id="asset-jarigobbi-character"; Title="자린고비 메인 캐릭터 디자인"; Category="CHARACTER & ASSET"; Image="assets\images\character\jaringobi\jaringobi-thumbnail.jpg"; Accent="#C95B38" },
  @{ Id="asset-item-illustration"; Title="게임 아이템 일러스트 외주 작업"; Category="CHARACTER & ASSET"; Image="assets\images\character\game-items\game-items-thumbnail.jpg"; Accent="#4E78B4" },
  @{ Id="asset-ogq-sticker"; Title="OGQ 네이버 스티커 콘텐츠"; Category="CHARACTER & ASSET"; Image="assets\images\character\ogq-stickers\ogq-stickers-thumbnail.jpg"; Accent="#E49742" },
  @{ Id="video-ably-hero"; Title="에이블리 히어로 AI 영상"; Category="VIDEO"; Image="assets\images\projects\thumb-ably-01-v2.png"; Accent="#D7688A" },
  @{ Id="video-yeogida-event"; Title="여기어때 이벤트 AI 영상"; Category="VIDEO"; Image="assets\images\generated\video-yeogida-event-source.png"; Accent="#4B86A8" }
)

function Draw-CoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [System.Drawing.Rectangle]$Target,
    [System.Drawing.Drawing2D.GraphicsPath]$ClipPath
  )
  $state = $Graphics.Save()
  $Graphics.SetClip($ClipPath)
  $sourceAspect = $Image.Width / $Image.Height
  $targetAspect = $Target.Width / $Target.Height
  if ($sourceAspect -gt $targetAspect) {
    $sourceHeight = $Image.Height
    $sourceWidth = [int]($sourceHeight * $targetAspect)
    $sourceX = [int](($Image.Width - $sourceWidth) / 2)
    $sourceY = 0
  } else {
    $sourceWidth = $Image.Width
    $sourceHeight = [int]($sourceWidth / $targetAspect)
    $sourceX = 0
    $sourceY = [int](($Image.Height - $sourceHeight) / 2)
  }
  $Graphics.DrawImage($Image, $Target, $sourceX, $sourceY, $sourceWidth, $sourceHeight, [System.Drawing.GraphicsUnit]::Pixel)
  $Graphics.Restore($state)
}

foreach ($project in $projects) {
  $sourcePath = Join-Path $root $project.Image
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Missing source image: $sourcePath"
  }

  $bitmap = New-Object System.Drawing.Bitmap 1000,1250
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#F0F0EC"))

  $accent = [System.Drawing.ColorTranslator]::FromHtml($project.Accent)
  $ink = [System.Drawing.ColorTranslator]::FromHtml("#141414")
  $muted = [System.Drawing.ColorTranslator]::FromHtml("#6E6E69")
  $accentBrush = New-Object System.Drawing.SolidBrush $accent
  $inkBrush = New-Object System.Drawing.SolidBrush $ink
  $mutedBrush = New-Object System.Drawing.SolidBrush $muted
  $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

  $graphics.FillEllipse($accentBrush, -150, 360, 610, 610)
  $graphics.FillEllipse($whiteBrush, 610, -230, 610, 610)

  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $mainPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $mainPath.AddEllipse(390, 285, 690, 690)
  Draw-CoverImage -Graphics $graphics -Image $source -Target ([System.Drawing.Rectangle]::new(390,285,690,690)) -ClipPath $mainPath

  $secondaryPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $secondaryPath.AddEllipse(55, 700, 445, 445)
  Draw-CoverImage -Graphics $graphics -Image $source -Target ([System.Drawing.Rectangle]::new(55,700,445,445)) -ClipPath $secondaryPath

  $categoryFont = New-Object System.Drawing.Font "Arial",22,([System.Drawing.FontStyle]::Bold)
  $titleFont = New-Object System.Drawing.Font "Malgun Gothic",52,([System.Drawing.FontStyle]::Bold)
  $indexFont = New-Object System.Drawing.Font "Arial",18,([System.Drawing.FontStyle]::Regular)
  $graphics.DrawString($project.Category, $categoryFont, $accentBrush, 58, 58)
  $graphics.DrawString($project.Title, $titleFont, $inkBrush, ([System.Drawing.RectangleF]::new(58,105,825,170)))
  $graphics.FillRectangle($accentBrush, 58, 300, 86, 12)
  $graphics.DrawString("PROJECT ARCHIVE / 2026", $indexFont, $mutedBrush, 660, 1185)

  $outputPath = Join-Path $outputDirectory "$($project.Id)-ring.jpg"
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
  $encoder = [System.Drawing.Imaging.Encoder]::Quality
  $parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
  $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $encoder, 90L
  $bitmap.Save($outputPath, $codec, $parameters)

  $parameters.Dispose()
  $categoryFont.Dispose()
  $titleFont.Dispose()
  $indexFont.Dispose()
  $mainPath.Dispose()
  $secondaryPath.Dispose()
  $source.Dispose()
  $accentBrush.Dispose()
  $inkBrush.Dispose()
  $mutedBrush.Dispose()
  $whiteBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Created $($projects.Count) ring thumbnails in $outputDirectory"
