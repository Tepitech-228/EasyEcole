$f = "D:\EasyEcole\easy-ecole-backend\src\modules\inscription\controllers\BordereauController.ts"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$bad = "l" + [char]0xE9 + "Audit"
$good = "l" + [char]0xE2 + [char]0x80 + [char]0x99 + "Audit"
Write-Host "Checking..."
if ($c.Contains($bad)) {
    $c = $c.Replace($bad, "l'Audit")
    [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed l'éAudit -> l'Audit"
} else {
    Write-Host "Pattern not found, checking content..."
    $idx = $c.IndexOf("éAudit")
    if ($idx -ge 0) {
        $context = $c.Substring($idx - 5, 20)
        Write-Host "Found at index $idx : '$context'"
    }
}
