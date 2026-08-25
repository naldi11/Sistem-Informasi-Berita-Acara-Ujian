<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Kata Sandi Bawaan Akun Hasil Impor
    |--------------------------------------------------------------------------
    |
    | Kata sandi yang diberikan pada akun dosen yang BARU dibuat oleh proses
    | import Excel. Akun yang sudah ada tidak pernah disentuh oleh import.
    |
    | Kosongkan nilainya (SIBAU_IMPORT_DEFAULT_PASSWORD= tanpa isi) agar setiap
    | akun baru mendapat kata sandi acak. Itu pilihan yang benar untuk
    | penggunaan sungguhan, tetapi mengharuskan admin menyetel kata sandi tiap
    | dosen lewat menu Edit Dosen, atau SMTP aktif untuk fitur Lupa Password.
    |
    */

    'import_default_password' => env('SIBAU_IMPORT_DEFAULT_PASSWORD', 'password'),

];
