Add-Type -AssemblyName System.Drawing

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$conceptRoot = Join-Path $root "assets\images\thumbnails\concepts\character-asset"
$extractRoot = Join-Path $conceptRoot "extracts"
New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

function Export-TransparentCrop {
  param(
    [string]$Source,
    [System.Drawing.Rectangle]$Crop,
    [string]$Destination
  )

  $image = [System.Drawing.Image]::FromFile((Join-Path $root $Source))
  $bitmap = [System.Drawing.Bitmap]::new($Crop.Width, $Crop.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  $attributes.SetColorKey(
    [System.Drawing.Color]::FromArgb(244,244,244),
    [System.Drawing.Color]::FromArgb(255,255,255)
  )
  $target = New-Object System.Drawing.Rectangle 0,0,$Crop.Width,$Crop.Height
  $graphics.DrawImage($image, $target, $Crop.X, $Crop.Y, $Crop.Width, $Crop.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
  $bitmap.Save((Join-Path $extractRoot $Destination), [System.Drawing.Imaging.ImageFormat]::Png)
  $attributes.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  $image.Dispose()
}

Export-TransparentCrop "assets\images\character\jaringobi\jaringobi-main.jpg" ([System.Drawing.Rectangle]::new(520,430,1200,2700)) "jaringobi-main.png"
Export-TransparentCrop "assets\images\character\ogq-stickers\ogq-stickers-main.jpg" ([System.Drawing.Rectangle]::new(42,38,730,720)) "ogq-mouse.png"
Export-TransparentCrop "assets\images\character\game-items\game-items-main.jpg" ([System.Drawing.Rectangle]::new(1135,445,355,250)) "game-camera.png"
Export-TransparentCrop "assets\images\character\game-items\game-items-main.jpg" ([System.Drawing.Rectangle]::new(610,45,370,285)) "game-water-gun.png"
Export-TransparentCrop "assets\images\character\game-items\game-items-main.jpg" ([System.Drawing.Rectangle]::new(420,365,185,290)) "game-badge.png"
Export-TransparentCrop "assets\images\character\game-items\game-items-main.jpg" ([System.Drawing.Rectangle]::new(405,675,365,225)) "game-vip-card.png"
Export-TransparentCrop "assets\images\character\game-items\game-items-main.jpg" ([System.Drawing.Rectangle]::new(738,676,397,214)) "game-ticket.png"

function Draw-RotatedImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Angle
  )
  $state = $Graphics.Save()
  $Graphics.TranslateTransform($X + $Width / 2, $Y + $Height / 2)
  $Graphics.RotateTransform($Angle)
  $Graphics.DrawImage($Image, -$Width / 2, -$Height / 2, $Width, $Height)
  $Graphics.Restore($state)
}

function Draw-ContainedImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )
  $scale = [Math]::Min($Width / $Image.Width, $Height / $Image.Height)
  $drawWidth = $Image.Width * $scale
  $drawHeight = $Image.Height * $scale
  $drawX = $X + (($Width - $drawWidth) / 2)
  $drawY = $Y + (($Height - $drawHeight) / 2)
  $Graphics.DrawImage($Image, [float]$drawX, [float]$drawY, [float]$drawWidth, [float]$drawHeight)
}

function Draw-ArcText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Radius,
    [float]$StartDegrees,
    [float]$EndDegrees
  )
  $characters = $Text.ToCharArray()
  for ($index = 0; $index -lt $characters.Length; $index++) {
    $progress = if ($characters.Length -gt 1) { $index / ($characters.Length - 1) } else { 0 }
    $angle = $StartDegrees + (($EndDegrees - $StartDegrees) * $progress)
    $radians = $angle * [Math]::PI / 180
    $x = $CenterX + [Math]::Cos($radians) * $Radius
    $y = $CenterY + [Math]::Sin($radians) * $Radius
    $state = $Graphics.Save()
    $Graphics.TranslateTransform([float]$x, [float]$y)
    $Graphics.RotateTransform([float]($angle + 90))
    $size = $Graphics.MeasureString([string]$characters[$index], $Font)
    $Graphics.DrawString([string]$characters[$index], $Font, $Brush, -$size.Width / 2, -$size.Height / 2)
    $Graphics.Restore($state)
  }
}

$canvas = [System.Drawing.Bitmap]::new(1000, 1250, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#F4F0E8"))

$ink = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#171717"))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#5C5A56"))
$blue = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#0B6FE8"))
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$bluePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#0B6FE8")),3
$inkPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#171717")),2

$graphics.FillEllipse($white, 816, -26, 236, 236)
$graphics.FillPie($blue, 576, 424, 428, 428, 180, 90)
$graphics.FillPie($blue, -190, 764, 380, 380, 270, 90)
$graphics.FillEllipse($blue, 90, 1039, 52, 52)
$graphics.FillEllipse($blue, 874, 962, 86, 86)

$smallFont = New-Object System.Drawing.Font "Arial",14,([System.Drawing.FontStyle]::Bold)
$serifFont = New-Object System.Drawing.Font "Georgia",47,([System.Drawing.FontStyle]::Regular)
$koreanFont = New-Object System.Drawing.Font "Malgun Gothic",34,([System.Drawing.FontStyle]::Bold)
$metaFont = New-Object System.Drawing.Font "Arial",12,([System.Drawing.FontStyle]::Regular)
$yearFont = New-Object System.Drawing.Font "Georgia",18,([System.Drawing.FontStyle]::Regular)

$graphics.DrawString("PROJECT CATEGORY / 01", $smallFont, $ink, 62, 45)
Draw-ArcText $graphics "Character & Asset" $serifFont $ink 400 330 240 208 332
$graphics.DrawString("캐릭터와 아이템으로 확장한", $koreanFont, $ink, 62, 246)
$graphics.DrawString("에셋 디자인", $koreanFont, $ink, 62, 295)
$graphics.DrawString("ILLUSTRATION · OGQ STICKER · GAME ASSET", $metaFont, $muted, 64, 364)
$graphics.DrawString("2026", $yearFont, $ink, 885, 356)

$ogq = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "ogq-mouse.png"))
$jaringobi = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "jaringobi-main.png"))
$camera = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "game-camera.png"))
$gun = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "game-water-gun.png"))
$badge = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "game-badge.png"))
$vip = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "game-vip-card.png"))
$ticket = [System.Drawing.Image]::FromFile((Join-Path $extractRoot "game-ticket.png"))

$ogqPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$ogqPath.AddBezier(34,535,34,448,109,399,203,410)
$ogqPath.AddBezier(203,410,303,421,388,477,406,567)
$ogqPath.AddBezier(406,567,425,663,349,746,247,760)
$ogqPath.AddBezier(247,760,130,776,35,680,34,535)
$state = $graphics.Save()
$graphics.SetClip($ogqPath)
$graphics.FillRectangle($white, 24, 395, 430, 380)
Draw-ContainedImage $graphics $ogq 4 395 450 410
$graphics.Restore($state)

Draw-ContainedImage $graphics $jaringobi 560 410 390 650
Draw-RotatedImage $graphics $camera 404 805 320 228 -7
Draw-RotatedImage $graphics $gun 198 878 275 220 9
Draw-RotatedImage $graphics $badge 64 735 150 210 -8
Draw-RotatedImage $graphics $vip 646 1035 288 166 3
Draw-RotatedImage $graphics $ticket 58 1094 360 128 -2

$star = @([System.Drawing.PointF]::new(452,700),[System.Drawing.PointF]::new(464,728),[System.Drawing.PointF]::new(492,740),[System.Drawing.PointF]::new(464,752),[System.Drawing.PointF]::new(452,780),[System.Drawing.PointF]::new(440,752),[System.Drawing.PointF]::new(412,740),[System.Drawing.PointF]::new(440,728))
$graphics.FillPolygon($blue, $star)
$graphics.DrawArc($inkPen, 850, 680, 86, 112, 290, 92)
$graphics.DrawLine($inkPen, 917, 778, 932, 789)
$graphics.DrawLine($inkPen, 932, 789, 940, 771)
$graphics.DrawArc($bluePen, 260, 692, 132, 54, 196, 124)
$graphics.FillEllipse($blue, 383, 714, 10, 10)

$output = Join-Path $conceptRoot "character-asset-collage-concept.png"
$canvas.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)

$preview = New-Object System.Drawing.Bitmap 400,500
$previewGraphics = [System.Drawing.Graphics]::FromImage($preview)
$previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$previewGraphics.DrawImage($canvas, 0, 0, 400, 500)
$preview.Save((Join-Path $conceptRoot "character-asset-collage-web-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$ringCrop = New-Object System.Drawing.Bitmap 750,1000
$ringCropGraphics = [System.Drawing.Graphics]::FromImage($ringCrop)
$ringCropGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ringCropGraphics.DrawImage($canvas, ([System.Drawing.Rectangle]::new(0,0,750,1000)), 31, 0, 938, 1250, [System.Drawing.GraphicsUnit]::Pixel)
$ringCrop.Save((Join-Path $conceptRoot "character-asset-collage-ring-crop.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$ringPreview = New-Object System.Drawing.Bitmap 270,360
$ringPreviewGraphics = [System.Drawing.Graphics]::FromImage($ringPreview)
$ringPreviewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ringPreviewGraphics.DrawImage($ringCrop, 0, 0, 270, 360)
$ringPreview.Save((Join-Path $conceptRoot "character-asset-collage-ring-web-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$ringPreviewGraphics.Dispose()
$ringPreview.Dispose()
$ringCropGraphics.Dispose()
$ringCrop.Dispose()
$previewGraphics.Dispose()
$preview.Dispose()
$ogqPath.Dispose()
@($ogq,$jaringobi,$camera,$gun,$badge,$vip,$ticket) | ForEach-Object { $_.Dispose() }
@($smallFont,$serifFont,$koreanFont,$metaFont,$yearFont) | ForEach-Object { $_.Dispose() }
@($ink,$muted,$blue,$white,$bluePen,$inkPen) | ForEach-Object { $_.Dispose() }
$graphics.Dispose()
$canvas.Dispose()

Write-Output "Character & Asset concept created."
