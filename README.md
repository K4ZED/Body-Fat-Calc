# Body Fat Formula Documentation

Dokumentasi ini menjelaskan dua rumus yang dipakai di kode:

* **US Navy Body Fat Formula** (`navyBF`)
* **BMI-based Body Fat Estimation** (`bmiBF`)

---

## 1. US Navy Body Fat Formula

Fungsi:

```js
function navyBF(height, neck, waist, hip, g) {
  if (g === 'male') {
    if (waist <= neck) throw new Error('Waist harus lebih besar dari neck.');
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  }
  if (!hip) throw new Error('Hip wajib diisi untuk female.');
  if (waist + hip <= neck) throw new Error('Waist + hip harus lebih besar dari neck.');
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
}
```

### Rumus untuk pria

Body density:

[
D = 1.0324 - 0.19077 \cdot \log_{10}(waist - neck) + 0.15456 \cdot \log_{10}(height)
]

Lalu body fat percentage:

[
%BF = \frac{495}{D} - 450
]

Jika digabung:

[
%BF = \frac{495}{1.0324 - 0.19077 \cdot \log_{10}(waist - neck) + 0.15456 \cdot \log_{10}(height)} - 450
]

### Rumus untuk wanita

Body density:

[
D = 1.29579 - 0.35004 \cdot \log_{10}(waist + hip - neck) + 0.22100 \cdot \log_{10}(height)
]

Lalu body fat percentage:

[
%BF = \frac{495}{D} - 450
]

Jika digabung:

[
%BF = \frac{495}{1.29579 - 0.35004 \cdot \log_{10}(waist + hip - neck) + 0.22100 \cdot \log_{10}(height)} - 450
]

### Parameter

* `height`: tinggi badan
* `neck`: lingkar leher
* `waist`: lingkar pinggang
* `hip`: lingkar pinggul, wajib untuk wanita
* `g`: gender, diharapkan bernilai `'male'` atau selain itu dianggap female pada implementasi saat ini

### Validasi di fungsi

#### Pria

* `waist` harus lebih besar dari `neck`
* jika tidak, fungsi akan melempar error:

```js
throw new Error('Waist harus lebih besar dari neck.');
```

#### Wanita

* `hip` wajib diisi
* `waist + hip` harus lebih besar dari `neck`
* jika tidak, fungsi akan melempar error

### Catatan satuan

Rumus ini umumnya dipakai dengan **inci**.

Kalau input yang digunakan adalah **cm**, hasil bisa berbeda dari referensi standar kecuali semua parameter dikonversi dulu ke inci:

```js
const toInch = (cm) => cm / 2.54;
```

---

## 2. BMI-based Body Fat Estimation

Fungsi:

```js
function bmiBF(bmi, age, g) {
  return (1.2 * bmi) + (0.23 * age) - (10.8 * (g === 'male' ? 1 : 0)) - 5.4;
}
```

### Rumus umum

[
%BF = 1.2 \cdot BMI + 0.23 \cdot Age - 10.8 \cdot Sex - 5.4
]

dengan:

* `BMI` = body mass index
* `Age` = usia
* `Sex = 1` untuk pria
* `Sex = 0` untuk wanita

### Bentuk khusus

#### Pria

[
%BF = 1.2 \cdot BMI + 0.23 \cdot Age - 10.8 - 5.4
]

#### Wanita

[
%BF = 1.2 \cdot BMI + 0.23 \cdot Age - 5.4
]

### Parameter

* `bmi`: nilai BMI
* `age`: usia
* `g`: gender

  * jika `g === 'male'`, maka faktor gender = `1`
  * selain itu, faktor gender = `0`

---

## 3. Contoh penggunaan

```js
const maleNavy = navyBF(70, 15, 32, null, 'male');
const femaleNavy = navyBF(65, 13, 28, 36, 'female');

const maleBmiBF = bmiBF(24.2, 28, 'male');
const femaleBmiBF = bmiBF(24.2, 28, 'female');
```

---

## 4. Catatan implementasi

Beberapa hal yang perlu diperhatikan dari implementasi saat ini:

1. `navyBF` menganggap semua nilai selain `'male'` sebagai female.
2. Pada female, validasi `if (!hip)` akan menganggap `0`, `null`, `undefined`, atau string kosong sebagai tidak valid.
3. Untuk akurasi yang lebih baik, sebaiknya validasi gender dibuat eksplisit.
4. Untuk dokumentasi publik, tulis dengan jelas apakah input menggunakan **inci** atau **cm**.

Contoh validasi yang lebih aman:

```js
if (!['male', 'female'].includes(g)) {
  throw new Error("Gender harus 'male' atau 'female'.");
}
```

---

## 5. Ringkasan

* `navyBF()` memakai **US Navy body density formula** lalu mengonversinya ke **body fat percentage** dengan rumus `495 / density - 450`
* `bmiBF()` memakai rumus estimasi body fat berbasis **BMI, usia, dan gender**
* Untuk `navyBF()`, pastikan satuan konsisten dan idealnya menggunakan **inci**
* Untuk female pada `navyBF()`, parameter `hip` wajib diisi
