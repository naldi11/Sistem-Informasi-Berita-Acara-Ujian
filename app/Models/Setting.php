<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $table = 'settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::find($key);
        if (!$setting) {
            return $default;
        }

        $val = $setting->value;

        // Cast boolean values stored as strings
        if ($val === 'true') return true;
        if ($val === 'false') return false;

        return $val;
    }

    /**
     * Set setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @return self
     */
    public static function setValue(string $key, $value): self
    {
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }

        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
