import sys
import pytest

if __name__ == '__main__':
    with open('test_results.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        sys.stderr = f
        pytest.main(['backend/test_packing.py', '-v', '--tb=short'])
