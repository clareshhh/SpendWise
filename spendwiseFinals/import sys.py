import sys
import os
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.uic import loadUi
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class MyWindow(QMainWindow):
    def __init__(self):
        super(MyWindow, self).__init__()
        loadUi("main.ui", self)

        # Create the browser widget
        self.browser = QWebEngineView(self)

        # Load the HTML file
        html_path = os.path.abspath("example.html")  # your HTML file here
        self.browser.load(QUrl.fromLocalFile(html_path))

        # Set the browser as the central widget of the main window
        self.setCentralWidget(self.browser)

# Run the application
app = QApplication(sys.argv)
window = MyWindow()
window.show()
sys.exit(app.exec_())