"""
statistics.py
-------------
Pure-functional service that aggregates YOLO detection results into
a waste-count dictionary and builds the narrative prompt for the LLM.

No external dependencies — works entirely on standard Python types.
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Type alias for a single detection dict returned by detector.run_inference()
Detection = Dict[str, Any]

# Type alias for the aggregated statistics mapping: {class_name -> count}
WasteStatistics = Dict[str, int]


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def compute_statistics(detections: List[Detection]) -> WasteStatistics:
    """
    Count occurrences of each waste class in *detections*.

    Parameters
    ----------
    detections : list of dict
        Each dict must have at minimum a ``"class"`` key (str).
        The ``"confidence"`` key is ignored by this function.

    Returns
    -------
    dict
        Mapping of ``{class_name: count}`` sorted by count descending.
        Returns an empty dict if *detections* is empty.

    Examples
    --------
    >>> compute_statistics([
    ...     {"class": "plastic", "confidence": 0.91},
    ...     {"class": "plastic", "confidence": 0.88},
    ...     {"class": "can",     "confidence": 0.93},
    ... ])
    {'plastic': 2, 'can': 1}
    """
    counts: WasteStatistics = {}

    for detection in detections:
        class_name: str = detection.get("class", "unknown")
        counts[class_name] = counts.get(class_name, 0) + 1

    # Sort by count descending so the most prevalent waste appears first
    sorted_counts: WasteStatistics = dict(
        sorted(counts.items(), key=lambda item: item[1], reverse=True)
    )

    logger.info(
        "Waste statistics computed: %s  (total objects: %d)",
        sorted_counts,
        sum(sorted_counts.values()),
    )
    return sorted_counts


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def build_audit_prompt(statistics: WasteStatistics) -> str:
    """
    Build the LLM prompt from the aggregated *statistics*.

    Parameters
    ----------
    statistics : dict
        Mapping of ``{class_name: count}`` as returned by :func:`compute_statistics`.

    Returns
    -------
    str
        A structured natural-language prompt ready to be sent to the LLM.

    Notes
    -----
    When *statistics* is empty (no waste detected) the prompt explicitly
    states this so the LLM can still return a meaningful response.
    """
    if not statistics:
        waste_lines = "Tidak ada objek sampah yang terdeteksi pada gambar."
    else:
        waste_lines = "\n".join(
            f"- {class_name.title()}: {count}"
            for class_name, count in statistics.items()
        )

    prompt = f"""Anda adalah konsultan manajemen sampah lingkungan yang ahli dalam sistem audit sampah cerdas.

Objek sampah berikut telah terdeteksi pada gambar yang diambil di lokasi audit sampah:

{waste_lines}

Berdasarkan data ini, buatlah laporan audit yang ringkas dan profesional dalam **Bahasa Indonesia** yang mencakup lima bagian berikut:

1. **Ringkasan Sampah** — Deskripsikan secara singkat total volume dan komposisi sampah yang terdeteksi.
2. **Klasifikasi Sampah** — Klasifikasikan setiap jenis sampah yang terdeteksi (misalnya: dapat didaur ulang, organik, berbahaya, atau sampah umum).
3. **Rekomendasi Daur Ulang** — Berikan rekomendasi daur ulang atau pemanfaatan kembali yang spesifik dan dapat ditindaklanjuti untuk setiap jenis sampah yang terdeteksi.
4. **Dampak Lingkungan** — Jelaskan potensi risiko atau dampak lingkungan jika sampah ini tidak dikelola dengan benar.
5. **Tindakan yang Disarankan** — Sebutkan 3–5 langkah konkret yang harus segera dilakukan oleh pengelola lokasi.

PENTING:
- Seluruh laporan harus ditulis dalam **Bahasa Indonesia** yang baik dan benar.
- Gunakan poin-poin (bullet points) di mana sesuai.
- Jaga agar laporan tetap profesional, ringkas, dan berbasis fakta.
- JANGAN menambahkan catatan penutup, disclaimer, atau keterangan tambahan setelah bagian ke-5.
- JANGAN menambahkan tanda tangan, nama konsultan, atau tanggal di akhir laporan.
- JANGAN menambahkan kalimat seperti "Catatan:", "Disusun oleh:", "Tanggal:", atau sejenisnya.
- Akhiri laporan tepat setelah poin terakhir pada bagian "5. Tindakan yang Disarankan".
"""
    return prompt.strip()
