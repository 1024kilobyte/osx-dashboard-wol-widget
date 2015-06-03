#!/usr/bin/env python
import sys
import socket
s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

# Convert MAC address string to byte string
bytes = []
hexStr = ''.join( sys.argv[1].split(":") )

for i in range(0, len(hexStr), 2):
	bytes.append( chr( int (hexStr[i:i+2], 16 ) ) )

# Send packet with subnetmask and port
s.sendto('\xff' * 6 + ''.join( bytes ) * 16, (sys.argv[2], int(sys.argv[3])))