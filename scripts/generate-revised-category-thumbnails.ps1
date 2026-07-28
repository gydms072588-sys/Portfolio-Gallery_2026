Add-Type -AssemblyName System.Drawing

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$outputRoot = Join-Path $root "assets\images\category-thumbnails"
$fontName = "Malgun Gothic"

function New-Canvas([bool]$dark) {
  $bitmap = New-Object System.Drawing.Bitmap 1500, 2000
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $background = if ($dark) { [System.Drawing.Color]::Black } else { [System.Drawing.Color]::White }
  $graphics.Clear($background)
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Get-Ink([bool]$dark) {
  if ($dark) { return [System.Drawing.Color]::White }
  return [System.Drawing.Color]::Black
}

function Draw-Heading($graphics, [bool]$dark, [string]$category, [string]$title) {
  $ink = Get-Ink $dark
  $brush = New-Object System.Drawing.SolidBrush $ink
  $categoryFont = New-Object System.Drawing.Font $fontName, 30, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $titleFont = New-Object System.Drawing.Font $fontName, 70, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  try {
    $graphics.DrawString($category, $categoryFont, $brush, 96, 100)
    $graphics.DrawString($title, $titleFont, $brush, 90, 170)
  } finally {
    $categoryFont.Dispose()
    $titleFont.Dispose()
    $brush.Dispose()
  }
}

function Draw-MinimalFrame($graphics, [bool]$dark) {
  $ink = Get-Ink $dark
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(105, $ink)), 2
  try {
    $graphics.DrawLine($pen, 92, 470, 230, 470)
    $graphics.DrawLine($pen, 92, 470, 92, 608)
    $graphics.DrawLine($pen, 1270, 470, 1408, 470)
    $graphics.DrawLine($pen, 1408, 470, 1408, 608)
    $graphics.DrawLine($pen, 92, 1770, 230, 1770)
    $graphics.DrawLine($pen, 92, 1632, 92, 1770)
    $graphics.DrawLine($pen, 1270, 1770, 1408, 1770)
    $graphics.DrawLine($pen, 1408, 1632, 1408, 1770)
  } finally {
    $pen.Dispose()
  }
}

function Draw-TransparentAsset($graphics, [string]$path, [System.Drawing.Rectangle]$destination) {
  $image = [System.Drawing.Image]::FromFile($path)
  try {
    $graphics.DrawImage($image, $destination)
  } finally {
    $image.Dispose()
  }
}

function Draw-CroppedAsset(
  $graphics,
  [string]$path,
  [System.Drawing.Rectangle]$sourceRectangle,
  [System.Drawing.Rectangle]$destination
) {
  $image = [System.Drawing.Image]::FromFile($path)
  try {
    $graphics.DrawImage(
      $image,
      $destination,
      $sourceRectangle.X,
      $sourceRectangle.Y,
      $sourceRectangle.Width,
      $sourceRectangle.Height,
      [System.Drawing.GraphicsUnit]::Pixel
    )
  } finally {
    $image.Dispose()
  }
}

function Save-Canvas($canvas, [string]$path) {
  $directory = Split-Path -Parent $path
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  try {
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function New-CleanOgqAsset([string]$sourcePath, [string]$outputPath) {
  $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
  try {
    $clean = New-Object System.Drawing.Bitmap $source.Width, $source.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($clean)
      try {
        $graphics.DrawImageUnscaled($source, 0, 0)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $transparent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Transparent)
        try {
          # Remove only disconnected decorative hearts and dots. The mouse,
          # ribbon and attached balls remain pixel-identical to the source.
          $clearAreas = @(
            (New-Object System.Drawing.Rectangle 0, 0, 210, 230),
            (New-Object System.Drawing.Rectangle 625, 0, 105, 260),
            (New-Object System.Drawing.Rectangle 570, 130, 55, 65),
            (New-Object System.Drawing.Rectangle 700, 190, 30, 120),
            (New-Object System.Drawing.Rectangle 0, 590, 210, 130),
            (New-Object System.Drawing.Rectangle 205, 625, 145, 95),
            (New-Object System.Drawing.Rectangle 555, 570, 175, 150)
          )
          foreach ($area in $clearAreas) {
            $graphics.FillRectangle($transparent, $area)
          }
        } finally {
          $transparent.Dispose()
        }
      } finally {
        $graphics.Dispose()
      }
      $clean.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $clean.Dispose()
    }
  } finally {
    $source.Dispose()
  }
}

function New-TravelThumbnail([bool]$dark, [string]$path) {
  $canvas = New-Canvas $dark
  $graphics = $canvas.Graphics
  Draw-Heading $graphics $dark "VIDEO" "여행 이벤트 영상"
  Draw-MinimalFrame $graphics $dark

  $sourcePath = Join-Path $root "assets\images\generated\video-yeogida-event-source.png"
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    # Original female subject only. The crop deliberately ends before the second figure.
    $sourceRect = New-Object System.Drawing.Rectangle 330, 220, 455, 721
    $destinationRect = New-Object System.Drawing.Rectangle 350, 500, 800, 1268
    $graphics.DrawImage(
      $source,
      $destinationRect,
      $sourceRect.X,
      $sourceRect.Y,
      $sourceRect.Width,
      $sourceRect.Height,
      [System.Drawing.GraphicsUnit]::Pixel
    )
  } finally {
    $source.Dispose()
  }

  Save-Canvas $canvas $path
}

function New-AssetThumbnail(
  [bool]$dark,
  [string]$category,
  [string]$title,
  [string]$assetPath,
  [System.Drawing.Rectangle]$destination,
  [string]$path
) {
  $canvas = New-Canvas $dark
  $graphics = $canvas.Graphics
  Draw-Heading $graphics $dark $category $title
  Draw-MinimalFrame $graphics $dark
  Draw-TransparentAsset $graphics $assetPath $destination
  Save-Canvas $canvas $path
}

function New-CroppedAssetThumbnail(
  [bool]$dark,
  [string]$category,
  [string]$title,
  [string]$assetPath,
  [System.Drawing.Rectangle]$sourceRectangle,
  [System.Drawing.Rectangle]$destination,
  [string]$path
) {
  $canvas = New-Canvas $dark
  $graphics = $canvas.Graphics
  Draw-Heading $graphics $dark $category $title
  Draw-MinimalFrame $graphics $dark
  Draw-CroppedAsset $graphics $assetPath $sourceRectangle $destination
  Save-Canvas $canvas $path
}

$travelDir = Join-Path $outputRoot "video"
New-TravelThumbnail $true (Join-Path $travelDir "video-yeogida-event-lightmode-black-v2.png")
New-TravelThumbnail $false (Join-Path $travelDir "video-yeogida-event-nightmode-white-v2.png")

$extractRoot = Join-Path $root "assets\images\thumbnails\concepts\character-asset\extracts"
$assetDir = Join-Path $outputRoot "character-asset"
$cleanOgqPath = Join-Path $extractRoot "ogq-mouse-clean.png"
New-CleanOgqAsset (Join-Path $extractRoot "ogq-mouse.png") $cleanOgqPath

# Front-facing character in both theme variants, using the same source pixels.
New-AssetThumbnail $true "CHARACTER & ASSET" "자린고비 캐릭터 디자인" `
  (Join-Path $extractRoot "jaringobi-main.png") `
  (New-Object System.Drawing.Rectangle 430, 430, 640, 1440) `
  (Join-Path $assetDir "asset-jarigobbi-character-lightmode-black-v2.png")
New-AssetThumbnail $false "CHARACTER & ASSET" "자린고비 캐릭터 디자인" `
  (Join-Path $extractRoot "jaringobi-main.png") `
  (New-Object System.Drawing.Rectangle 430, 430, 640, 1440) `
  (Join-Path $assetDir "asset-jarigobbi-character-white-only-v2.png")

New-CroppedAssetThumbnail $true "CHARACTER & ASSET" "게임 아이템 일러스트" `
  (Join-Path $extractRoot "game-camera.png") `
  (New-Object System.Drawing.Rectangle 0, 40, 355, 200) `
  (New-Object System.Drawing.Rectangle 275, 700, 950, 535) `
  (Join-Path $assetDir "asset-item-illustration-lightmode-black-v2.png")
New-CroppedAssetThumbnail $false "CHARACTER & ASSET" "게임 아이템 일러스트" `
  (Join-Path $extractRoot "game-camera.png") `
  (New-Object System.Drawing.Rectangle 0, 40, 355, 200) `
  (New-Object System.Drawing.Rectangle 275, 700, 950, 535) `
  (Join-Path $assetDir "asset-item-illustration-nightmode-white-v2.png")

New-AssetThumbnail $true "CHARACTER & ASSET" "OGQ 감정 스티커" `
  $cleanOgqPath `
  (New-Object System.Drawing.Rectangle 260, 590, 980, 967) `
  (Join-Path $assetDir "asset-ogq-sticker-lightmode-black-v2.png")
New-AssetThumbnail $false "CHARACTER & ASSET" "OGQ 감정 스티커" `
  $cleanOgqPath `
  (New-Object System.Drawing.Rectangle 260, 590, 980, 967) `
  (Join-Path $assetDir "asset-ogq-sticker-nightmode-white-v2.png")
