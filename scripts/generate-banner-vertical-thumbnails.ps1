Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root "assets\images\banner-vertical-thumbnails"
New-Item -ItemType Directory -Force -Path $output | Out-Null

function Decode-Text([string]$Value) {
  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

$projects = @(
  @{ Id = "banner-ably-redesign"; Copy = Decode-Text "7Iqk7YOA7J287J2EIOyEoOuqhe2VmOqyjCDrs7Tsl6zso7zri6Q="; Source = "assets\images\projects\banner-ably-redesign-list-20260716.jpg"; Pattern = 0 },
  @{ Id = "banner-junosoft-commerce"; Copy = Decode-Text "7IOB7ZKI7J2YIOyduOyDgeydhCDsoJXrj4jtlZjri6Q="; Source = "assets\images\projects\banner-junosoft-commerce-list-20260716.jpg"; Pattern = 1 },
  @{ Id = "banner-winter-sale"; Copy = Decode-Text "6riw6rCEIO2VnOyglSDtmJztg53snYQg6rCV7KGw7ZWY64uk"; Source = "assets\images\projects\banner-winter-sale-list-20260716.jpg"; Pattern = 2 },
  @{ Id = "banner-kbcard-event"; Copy = Decode-Text "7Zic7YOd7J2EIOu5oOultOqyjCDrs7Tsl6zso7zri6Q="; Source = "assets\images\projects\banner-kbcard-event-list-20260716.jpg"; Pattern = 3 },
  @{ Id = "banner-univstore-event"; Copy = Decode-Text "7J287IOB7J2YIOqwgOy5mOulvCDsoITtlZjri6Q="; Source = "assets\images\projects\banner-univstore-event-list-20260716.jpg"; Pattern = 4 },
  @{ Id = "banner-shopping-gift"; Copy = Decode-Text "7ISg66y87J2YIOyInOqwhOydhCDri7Tri6Q="; Source = "assets\images\projects\banner-shopping-gift-list-20260716.jpg"; Pattern = 5 }
)

function Draw-CoverImage {
  param($Graphics, $Image, [System.Drawing.RectangleF]$Bounds)
  $scale = [Math]::Max($Bounds.Width / $Image.Width, $Bounds.Height / $Image.Height)
  $width = $Image.Width * $scale
  $height = $Image.Height * $scale
  $x = $Bounds.X + (($Bounds.Width - $width) / 2)
  $y = $Bounds.Y + (($Bounds.Height - $height) / 2)
  $state = $Graphics.Save()
  $Graphics.SetClip($Bounds)
  $Graphics.DrawImage($Image, [System.Drawing.RectangleF]::new($x, $y, $width, $height))
  $Graphics.Restore($state)
}

function Draw-Pattern {
  param($Graphics, $Pen, $Brush, [int]$Variant)
  $offset = $Variant * 22
  $Graphics.DrawEllipse($Pen, 170 + $offset, 520, 970, 970)
  $Graphics.DrawArc($Pen, 560, 690 - $offset, 760, 760, 210, 220)
  $Graphics.DrawLine($Pen, 110, 1510 - $offset, 1290, 560 + $offset)
  for ($row = 0; $row -lt 6; $row++) {
    for ($column = 0; $column -lt 6; $column++) {
      $Graphics.FillEllipse($Brush, 1080 + ($column * 28), 1280 + ($row * 28) - $offset, 7, 7)
    }
  }
}

foreach ($project in $projects) {
  foreach ($theme in @("lightmode-black", "nightmode-white")) {
    $isBlack = $theme -eq "lightmode-black"
    $background = if ($isBlack) { [System.Drawing.Color]::Black } else { [System.Drawing.Color]::White }
    $foreground = if ($isBlack) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    $soft = [System.Drawing.Color]::FromArgb(110, $foreground)

    $bitmap = [System.Drawing.Bitmap]::new(1500, 2000, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.Clear($background)

    $categoryFont = [System.Drawing.Font]::new("Arial", 33, [System.Drawing.FontStyle]::Bold)
    $copyFont = [System.Drawing.Font]::new("Malgun Gothic", 58, [System.Drawing.FontStyle]::Bold)
    $categoryBrush = [System.Drawing.SolidBrush]::new($foreground)
    $copyBrush = [System.Drawing.SolidBrush]::new($foreground)
    $patternPen = [System.Drawing.Pen]::new($soft, 3)
    $patternBrush = [System.Drawing.SolidBrush]::new($soft)

    $graphics.DrawString("BANNER", $categoryFont, $categoryBrush, 92, 92)
    $graphics.DrawString($project.Copy, $copyFont, $copyBrush, 88, 160)
    Draw-Pattern $graphics $patternPen $patternBrush $project.Pattern

    $sourcePath = Join-Path $root $project.Source
    $source = [System.Drawing.Image]::FromFile($sourcePath)
    $panel = [System.Drawing.RectangleF]::new(135, 545, 1230, 920)
    Draw-CoverImage $graphics $source $panel

    $borderPen = [System.Drawing.Pen]::new($soft, 2)
    $graphics.DrawRectangle($borderPen, 88, 70, 1324, 1840)

    $filename = "$($project.Id)-$theme-v1.png"
    $target = Join-Path $output $filename
    $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

    $borderPen.Dispose()
    $source.Dispose()
    $patternBrush.Dispose()
    $patternPen.Dispose()
    $copyBrush.Dispose()
    $categoryBrush.Dispose()
    $copyFont.Dispose()
    $categoryFont.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

foreach ($theme in @("lightmode-black", "nightmode-white")) {
  $sheet = [System.Drawing.Bitmap]::new(1200, 1120, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
  $sheetGraphics.Clear([System.Drawing.Color]::FromArgb(232, 232, 232))
  $sheetGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  for ($index = 0; $index -lt $projects.Count; $index++) {
    $column = $index % 3
    $row = [Math]::Floor($index / 3)
    $previewPath = Join-Path $output "$($projects[$index].Id)-$theme-v1.png"
    $previewImage = [System.Drawing.Image]::FromFile($previewPath)
    $sheetGraphics.DrawImage($previewImage, 30 + ($column * 390), 30 + ($row * 540), 360, 480)
    $previewImage.Dispose()
  }

  $sheet.Save((Join-Path $output "preview-$theme.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $sheetGraphics.Dispose()
  $sheet.Dispose()
}
